package cas

import (
	"bytes"
	"encoding/hex"
	"encoding/xml"
	"errors"
	"net/url"
	"time"

	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/byzcoin/contracts"
	personhood "go.dedis.ch/cothority/v3/personhood/contracts"
	"go.dedis.ch/cothority/v3/skipchain"
	"go.dedis.ch/onet/v3/log"
	"go.dedis.ch/protobuf"
)

type tXML = interface{}

func (cas CAS) containsLoginProof(userCoinID, servCoinID skipchain.SkipBlockID, block skipchain.SkipBlock, hashedChallenge []byte) (bool, error) {
	logI := func(e ...interface{}) { log.Info(e...) }
	logE := func(e ...interface{}) {
		buf := make([]interface{}, 1+len(e))
		buf[0] = "!! "
		copy(buf[1:], e)
		log.Warn(buf...)
	}
	logI("checking block: ", block.Hash.Short())

	var header byzcoin.DataHeader
	if err := protobuf.Decode(block.Data, &header); err != nil {
		logE("decoding DataHeader")
		return false, err
	}

	timestamp := time.Unix(-1, header.Timestamp)
	if timestamp.Add(cas.Config.TxValidityDuration).Before(time.Now()) {
		logE("block is too old")
		return false, errors.New("block is too old to be considered")
	}

	var body byzcoin.DataBody
	if err := protobuf.Decode(block.Payload, &body); err != nil {
		logE("decoding DataBody")
		return false, err
	}

	for _, res := range body.TxResults {
		logI("checking new tx")
		if !res.Accepted {
			logE("not accepted")
			continue
		}

		instructions := res.ClientTransaction.Instructions
		if len(instructions) != 2 {
			logE("incorrect instructions count")
			continue
		}

		isCoinTransfer := true
		for _, inst := range instructions {
			if inst.Invoke == nil ||
				inst.Invoke.ContractID != contracts.ContractCoinID ||
				inst.Invoke.Command != "transfer" {
				isCoinTransfer = false
				break
			}
		}
		if !isCoinTransfer {
			logE("not a transfer")
			continue
		}

		sendTx, recvTx := instructions[0], instructions[1]

		if len(sendTx.Invoke.Args) != 2 ||
			len(recvTx.Invoke.Args) != 3 {
			logE("incorrect args count")
			continue
		}

		sendSrc, sendDst := sendTx.InstanceID.Slice(), sendTx.Invoke.Args.Search("destination")
		recvSrc, recvDst := recvTx.InstanceID.Slice(), recvTx.Invoke.Args.Search("destination")
		if !bytes.Equal(sendDst, recvSrc) ||
			!bytes.Equal(sendSrc, recvDst) ||
			!bytes.Equal(servCoinID, recvSrc) ||
			!bytes.Equal(userCoinID, recvDst) {
			logE("not back and forth between userCoinID and servCoinID")
			continue
		}

		if !bytes.Equal(sendTx.Invoke.Args.Search("coin"), recvTx.Invoke.Args.Search("coin")) {
			logE("not same coin count")
			continue
		}

		if hashed := recvTx.Invoke.Args.Search(cas.Config.TxArgumentName); !bytes.Equal(hashedChallenge, hashed) {
			logE("not with hash of challenge")
			continue
		}

		logI("found correct tx")
		return true, nil
	}

	return false, nil
}

func (cas CAS) credInstIDtoCoinInstIDAndAlias(credID byzcoin.InstanceID) (skipchain.SkipBlockID, string, error) {
	proof, err := cas.Client.GetProof(credID.Slice())
	if err != nil {
		return nil, "", err
	}

	val, contractID, _, err := proof.Get(credID.Slice())
	if err != nil {
		return nil, "", err
	}
	if contractID != personhood.ContractCredentialID {
		return nil, "", errors.New("creds id aren't for a CoinInstance")
	}

	// TODO personhood.ContractCredentialFromBytes doesn't check for empty buffer
	if val == nil {
		return nil, "", errors.New("unknown user cred id")
	}
	credContract, err := personhood.ContractCredentialFromBytes(val)
	if err != nil {
		return nil, "", err
	}

	var coinInstID []byte
	var alias string
	for _, c := range credContract.(*personhood.ContractCredential).Credentials {
		if c.Name != "1-public" {
			continue
		}

		for _, a := range c.Attributes {
			switch a.Name {
			case "coin":
				coinInstID = a.Value
			case "alias":
				alias = string(a.Value)
			}
		}
	}

	if coinInstID == nil {
		return nil, "", errors.New("CoinInstance not found in creds")
	}

	return coinInstID, alias, nil
}

func (cas CAS) validateAndGetUserInfo(url url.URL, ticket string) (string, string, error) {
	const ServiceTicketPrefix = "ST-"
	const InstanceIDSize = 32

	url.RawQuery = ""
	url.Fragment = ""
	servCoinID, ok := cas.Config.ServiceToCoinInstanceIDs[url.String()]
	if !ok {
		return "", "", errors.New("invalid host")
	}

	if ticket[:3] != ServiceTicketPrefix {
		return "", "", errors.New("invalid ticket prefix")
	}

	packed, err := cas.Config.TicketDecoder(ticket[3:])
	if err != nil {
		return "", "", err
	}

	challenge := packed[:cas.Config.ChallengeSize]
	userCredIDRaw := packed[cas.Config.ChallengeSize:]
	if len(challenge) != int(cas.Config.ChallengeSize) ||
		len(userCredIDRaw) != InstanceIDSize {
		return "", "", errors.New("invalid ticket size")
	}

	userID := byzcoin.NewInstanceID(userCredIDRaw)
	userCoinID, alias, err := cas.credInstIDtoCoinInstIDAndAlias(userID)
	if err != nil {
		return "", "", err
	}

	latest, err := cas.Client.GetLatestBlock()
	if err != nil {
		return "", "", err
	}

	hashedChallenge := cas.Config.ChallengeHasher(challenge)
	block := latest
	for {
		found, err := cas.containsLoginProof(userCoinID, servCoinID, *block, hashedChallenge)
		if err != nil {
			return "", "", err
		}
		if found {
			break
		}

		id := block.BackLinkIDs[0]
		block, err = cas.Client.GetSingleBlock(id)
		if err != nil {
			return "", "", err
		}
	}

	if err != nil {
		return "", "", err
	}

	return "ol-" + hex.EncodeToString(userID[:8]), alias, nil
}

// ServiceValidateXML implement cas:/p3/serviceValidate
func (cas CAS) ServiceValidateXML(urlRaw, ticket string) tXML {
	type ServiceResponse struct {
		XMLName xml.Name `xml:"http://www.yale.edu/tp/cas serviceResponse"`
		Sub     tXML
	}

	type Attributes struct {
		XMLName xml.Name `xml:"attributes"`
		Alias   string   `xml:"alias"`
	}

	type AuthenticationSuccess struct {
		XMLName    xml.Name `xml:"authenticationSuccess"`
		Username   string   `xml:"user"`
		Ticket     string   `xml:"proxyGrantingSuccess"`
		Attributes Attributes
	}

	type AuthenticationFailure struct {
		XMLName xml.Name `xml:"authenticationFailure"`
		Code    string   `xml:"code,attr"`
		Message string   `xml:",chardata"`
	}

	fail := func(err error) AuthenticationFailure {
		return AuthenticationFailure{
			Code:    "INVALID_TICKET",
			Message: err.Error(),
		}
	}

	res := func() interface{} {
		url, err := url.ParseRequestURI(urlRaw)
		if err != nil {
			return fail(err)
		}

		username, alias, err := cas.validateAndGetUserInfo(*url, ticket)
		if err != nil {
			return fail(err)
		}

		return AuthenticationSuccess{
			Username:   username,
			Ticket:     ticket,
			Attributes: Attributes{Alias: alias},
		}
	}()

	return ServiceResponse{Sub: res}
}
