package cas

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"

	"go.dedis.ch/cothority/v3/skipchain"
	"go.dedis.ch/kyber/v3/suites"
	"go.dedis.ch/kyber/v3/util/encoding"
	"go.dedis.ch/onet/v3"
	"go.dedis.ch/onet/v3/network"

	"github.com/pelletier/go-toml"
)

// TicketDecoder represent a generic way to decode the ticket.
type TicketDecoder func(string) ([]byte, error)

// ChallengeHasher represent a generic way to hash the challenge.
type ChallengeHasher func([]byte) []byte

// Config hold everything installation specific.
type Config struct {
	ByzCoinID skipchain.SkipBlockID
	Roster    onet.Roster

	ServiceToCoinInstanceIDs map[string]skipchain.SkipBlockID

	CoinCost           uint
	TicketDecoder      TicketDecoder
	ChallengeSize      uint
	ChallengeHasher    ChallengeHasher
	TxArgumentName     string
	TxValidityDuration time.Duration
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
	case "base64url":
		return base64.URLEncoding.DecodeString, nil
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

// ParseConfig takes a TOML string and tries to parse it as Config.
func ParseConfig(tomlRaw []byte) (*Config, error) {
	var tomlConf struct {
		ByzCoinID string
		Servers   []struct {
			Address            network.Address
			Suite, Public, URL string
		}

		Services []struct {
			URLs           []string
			DarcInstanceID string
			CoinInstanceID string
		}

		CoinCost           uint
		TicketEncoding     string
		ChallengeSize      uint
		ChallengeHash      string
		TxArgumentName     string
		TxValidityDuration string
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

		id := network.NewServerIdentity(point, s.Address)
		id.URL = s.URL
		servers[i] = id
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
	for _, service := range tomlConf.Services {
		for _, url := range service.URLs {
			serviceToCoinInstanceIDs[url], err = hex.DecodeString(service.CoinInstanceID)
			if err != nil {
				return nil, err
			}
		}
	}

	txValidityDuration, err := time.ParseDuration(tomlConf.TxValidityDuration)
	if err != nil {
		return nil, err
	}

	return &Config{
		byzCoinID,
		*onet.NewRoster(servers),

		serviceToCoinInstanceIDs,

		tomlConf.CoinCost,
		ticketDecoder,
		tomlConf.ChallengeSize,
		challengeHash,
		tomlConf.TxArgumentName,
		txValidityDuration,
	}, nil
}
