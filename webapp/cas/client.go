package main

import (
	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/skipchain"
	"go.dedis.ch/onet/v3"
)

type clients struct {
	byzcoin   byzcoin.Client
	skipchain skipchain.Client
}

type Client struct {
	roster  onet.Roster
	clients clients
}

func NewClient(conf Config) Client {
	return Client{
		conf.Roster,
		clients{
			*byzcoin.NewClient(conf.ByzCoinID, conf.Roster),
			*skipchain.NewClient(),
		},
	}
}

func (c Client) GetSingleBlock(id skipchain.SkipBlockID) (*skipchain.SkipBlock, error) {
	return c.clients.skipchain.GetSingleBlock(&c.roster, id)
}

func (c Client) GetLatestBlock() (*skipchain.SkipBlock, error) {
	resp, err := c.clients.byzcoin.GetProofFromLatest(byzcoin.ConfigInstanceID.Slice())
	if err != nil {
		return nil, err
	}
	return &resp.Proof.Latest, nil
}
