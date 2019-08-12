package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"

	"go.dedis.ch/cothority/v3/skipchain"
	"go.dedis.ch/kyber/v3/suites"
	"go.dedis.ch/kyber/v3/util/encoding"
	"go.dedis.ch/onet/v3"
	"go.dedis.ch/onet/v3/network"

	"github.com/pelletier/go-toml"
)

type TicketDecoder func(string) ([]byte, error)
type ChallengeHasher func([]byte) []byte

type Config struct {
	ByzCoinID skipchain.SkipBlockID
	Roster    onet.Roster

	ServiceToCoinInstanceIDs map[string]skipchain.SkipBlockID

	TicketDecoder   TicketDecoder
	ChallengeSize   uint
	ChallengeHasher ChallengeHasher
	TxArgumentName  string
}

func parseSkipBlockID(raw string) (skipchain.SkipBlockID, error) {
	parsed, err := hex.DecodeString(raw)
	if err != nil {
		return nil, err
	}

	if len(parsed) != 32 {
		return nil, errors.New("invalid size for type SkipBlockID")
	}

	return parsed, nil
}

func parseTicketEncoding(raw string) (TicketDecoder, error) {
	switch raw {
	case "base64":
		return base64.StdEncoding.DecodeString, nil
	default:
		return nil, errors.New("unable to find TicketEncoding")
	}
}

func parseChallengeHash(raw string) (ChallengeHasher, error) {
	switch raw {
	case "sha256":
		return func(data []byte) []byte {
			ret := sha256.Sum256(data)
			return ret[:]
		}, nil
	default:
		return nil, errors.New("unable to find ChallengeHash")
	}
}

func ParseConfig(tomlRaw []byte) (*Config, error) {
	var tomlConf struct {
		ByzCoinID string
		Servers   []struct {
			Address       network.Address
			Suite, Public string
		}

		ServiceToCoinInstanceIDs map[string]string

		TicketEncoding string
		ChallengeSize  uint
		ChallengeHash  string
		TxArgumentName string
	}
	if err := toml.Unmarshal(tomlRaw, &tomlConf); err != nil {
		return nil, err
	}

	byzCoinID, err := parseSkipBlockID(tomlConf.ByzCoinID)
	if err != nil {
		return nil, err
	}

	servers := make([]*network.ServerIdentity, len(tomlConf.Servers))
	for i, s := range tomlConf.Servers {
		suite, err := suites.Find(s.Suite)
		if err != nil {
			return nil, err
		}

		point, err := encoding.StringHexToPoint(suite, s.Public)
		if err != nil {
			return nil, err
		}

		servers[i] = network.NewServerIdentity(point, s.Address)
	}

	ticketDecoder, err := parseTicketEncoding(tomlConf.TicketEncoding)
	if err != nil {
		return nil, err
	}

	challengeHash, err := parseChallengeHash(tomlConf.ChallengeHash)
	if err != nil {
		return nil, err
	}

	serviceToCoinInstanceIDs := make(map[string]skipchain.SkipBlockID)
	for k, v := range tomlConf.ServiceToCoinInstanceIDs {
		serviceToCoinInstanceIDs[k], err = hex.DecodeString(v)
		if err != nil {
			return nil, err
		}
	}

	return &Config{
		byzCoinID,
		*onet.NewRoster(servers),

		serviceToCoinInstanceIDs,

		ticketDecoder,
		tomlConf.ChallengeSize,
		challengeHash,
		tomlConf.TxArgumentName,
	}, nil
}
