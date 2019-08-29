package main

import (
	"bytes"
	"encoding/xml"
	"errors"
	"net/url"
	"time"

	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/byzcoin/contracts"
	"go.dedis.ch/cothority/v3/skipchain"
	"go.dedis.ch/protobuf"
)

// TODO eww, define interface with values?
type XML = interface{}

func (cas CAS) containsLoginProof(coinInstID skipchain.SkipBlockID, block skipchain.SkipBlock, hashedChallenge []byte) (bool, error) {
	var header byzcoin.DataHeader
	if err := protobuf.Decode(block.Data, &header); err != nil {
		return false, err
	}

	timestamp := time.Unix(-1, header.Timestamp)
	if timestamp.Add(cas.Config.TxValidityDuration).Before(time.Now()) {
		return false, errors.New("block is too old to be considered")
	}

	var body byzcoin.DataBody
	if err := protobuf.Decode(block.Payload, &body); err != nil {
		return false, err
	}

	for _, res := range body.TxResults {
		if !res.Accepted {
			continue
		}

		instructions := res.ClientTransaction.Instructions
		if len(instructions) != 2 {
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
			continue
		}

		sendTx, recvTx := instructions[0], instructions[1]

		if len(sendTx.Invoke.Args) != 2 ||
			len(recvTx.Invoke.Args) != 3 {
			continue
		}

		sendSrc, sendDst := sendTx.InstanceID.Slice(), sendTx.Invoke.Args.Search("destination")
		recvSrc, recvDst := recvTx.InstanceID.Slice(), recvTx.Invoke.Args.Search("destination")
		if !bytes.Equal(sendDst, recvSrc) ||
			!bytes.Equal(sendSrc, recvDst) ||
			!bytes.Equal(coinInstID, recvSrc) {
			continue
		}

		if !bytes.Equal(sendTx.Invoke.Args.Search("coin"), recvTx.Invoke.Args.Search("coin")) {
			continue
		}

		if hashed := recvTx.Invoke.Args.Search(cas.Config.TxArgumentName); bytes.Equal(hashedChallenge, hashed) {
			return true, nil
		}
	}

	return false, nil
}

func (cas CAS) validateAndGetUser(url url.URL, ticket string) (string, error) {
	const ServiceTicketPrefix = "ST-"

	coinInstID, ok := cas.Config.ServiceToCoinInstanceIDs[url.Host]
	if !ok {
		return "", errors.New("invalid host")
	}

	if ticket[:3] != ServiceTicketPrefix {
		return "", errors.New("invalid ticket prefix")
	}

	packed, err := cas.Config.TicketDecoder(ticket[3:])
	if err != nil {
		return "", err
	}

	challenge := packed[:cas.Config.ChallengeSize]
	if len(challenge) != int(cas.Config.ChallengeSize) {
		return "", errors.New("invalid ticket size")
	}

	latest, err := cas.Client.GetLatestBlock()
	if err != nil {
		return "", err
	}

	hashedChallenge := cas.Config.ChallengeHasher(challenge)
	block := latest
	for {
		found, err := cas.containsLoginProof(coinInstID, *block, hashedChallenge)
		if err != nil {
			return "", err
		}
		if found {
			break
		}

		id := block.BackLinkIDs[0]
		block, err = cas.Client.GetSingleBlock(id)
		if err != nil {
			return "", err
		}
	}

	if err != nil {
		return "", err
	}

	return "admin", nil
}

func (cas CAS) ServiceValidateXML(url_str, ticket string) XML {
	type ServiceResponse struct {
		XMLName xml.Name `xml:"http://www.yale.edu/tp/cas serviceResponse"`
		Sub     XML
	}

	type AuthenticationSuccess struct {
		XMLName  xml.Name `xml:"authenticationSuccess"`
		Username string   `xml:"user"`
		Ticket   string   `xml:"proxyGrantingSuccess"`
	}

	type AuthenticationFailure struct {
		XMLName xml.Name `xml:"authenticationFailure"`
		Code    string   `xml:"code,attr"`
		Message string   `xml:",chardata"`
	}

	// TODO add more error codes
	fail := func(err error) AuthenticationFailure {
		return AuthenticationFailure{
			Code:    "INVALID_TICKET",
			Message: err.Error(),
		}
	}

	res := func() interface{} {
		url, err := url.ParseRequestURI(url_str)
		if err != nil {
			return fail(err)
		}

		username, err := cas.validateAndGetUser(*url, ticket)
		if err != nil {
			return fail(err)
		}

		return AuthenticationSuccess{
			Username: username,
			Ticket:   ticket,
		}
	}()

	return ServiceResponse{Sub: res}
}
