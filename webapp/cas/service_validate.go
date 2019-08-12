package main

import (
	"bytes"
	"encoding/hex"
	"encoding/xml"
	"errors"
	"net/url"

	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/skipchain"
	"go.dedis.ch/protobuf"
)

// TODO eww, define interface with values?
type XML = interface{}

func containsChallenge(coinInstID skipchain.SkipBlockID, block skipchain.SkipBlock, hashedChallenge []byte) bool {
	var data byzcoin.DataBody
	if err := protobuf.Decode(block.Payload, &data); err != nil {
		return false
	}

	for _, res := range data.TxResults {
		if !res.Accepted {
			continue
		}

		instructions := res.ClientTransaction.Instructions
		if len(instructions) != 2 {
			continue
		}

		isValidTx := true
		for _, inst := range instructions {
			if inst.Invoke == nil ||
				inst.Invoke.ContractID != "coin" ||
				inst.Invoke.Command != "transfer" {
				isValidTx = false
			}
		}
		if !isValidTx {
			continue
		}

		sendTx, recvTx := instructions[0], instructions[1]

		if len(sendTx.Invoke.Args) != 2 ||
			len(recvTx.Invoke.Args) != 3 {
			continue
		}

		// TODO how to find in recvTx where is the money from?

		if hashed := recvTx.Invoke.Args.Search("challenge"); bytes.Equal(hashedChallenge, hashed) {
			return true
		}
	}

	return false
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

	println("challenge:       ", hex.EncodeToString(challenge))
	hashedChallenge := cas.Config.ChallengeHasher(challenge)
	println("hashed challenge:", hex.EncodeToString(hashedChallenge))
	block := latest
	for !containsChallenge(coinInstID, *block, hashedChallenge) {
		if block.Index == 0 {
			return "", errors.New("hit start of chain")
		}

		id := block.BackLinkIDs[0]
		println(">>", hex.EncodeToString(id))
		block, err = cas.Client.GetSingleBlock(id)
		if err != nil {
			return "", err
		}
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
