package cas

import (
	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/skipchain"
	"go.dedis.ch/onet/v3"
)

type clients struct {
	byzcoin   byzcoin.Client
	skipchain skipchain.Client
}

// Client allows to communicate with the blockchain.
type Client struct {
	roster  onet.Roster
	clients clients
}

// NewClient is the constructor.
func NewClient(conf Config) Client {
	return Client{
		conf.Roster,
		clients{
			*byzcoin.NewClient(conf.ByzCoinID, conf.Roster),
			*skipchain.NewClient(),
		},
	}
}

// GetSingleBlock returns the block corresponding to the given id.
func (c Client) GetSingleBlock(id skipchain.SkipBlockID) (*skipchain.SkipBlock, error) {
	return c.clients.skipchain.GetSingleBlock(&c.roster, id)
}

// GetProof returns a Proof of the availability of the given key.
func (c Client) GetProof(key []byte) (*byzcoin.Proof, error) {
	resp, err := c.clients.byzcoin.GetProofFromLatest(key)
	if err != nil {
		return nil, err
	}
	return &resp.Proof, nil
}

// GetLatestBlock returns the most recent block of the blockchain.
func (c Client) GetLatestBlock() (*skipchain.SkipBlock, error) {
	proof, err := c.GetProof(byzcoin.ConfigInstanceID.Slice())
	if err != nil {
		return nil, err
	}
	return &proof.Latest, nil
}
