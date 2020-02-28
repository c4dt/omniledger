package test

import (
	"crypto/sha256"
	"encoding/base64"
	"testing"
	"time"

	"go.dedis.ch/cothority/v3"
	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/byzcoin/contracts"
	"go.dedis.ch/cothority/v3/darc"
	personhood "go.dedis.ch/cothority/v3/personhood/contracts"
	"go.dedis.ch/cothority/v3/skipchain"
	"go.dedis.ch/onet/v3"

	"github.com/c4dt/omniledger/webapp/cas"
	"github.com/stretchr/testify/require"
)

// TODO standarize call (reimplemented everywhere in cothority)
func iid(contract string, d darc.Darc) byzcoin.InstanceID {
	h := sha256.New()
	h.Write([]byte(contract))
	h.Write(d.GetBaseID())
	return byzcoin.NewInstanceID(h.Sum(nil))
}

type nameCounters struct {
	User   uint
	Action uint
}

// ByzCoin represents a testing ByzCoin
type ByzCoin struct {
	Config cas.Config
	Admin  ThinUser

	localTest onet.LocalTest
	t         *testing.T
	client    byzcoin.Client

	// nameCounters allows to generate a unique and monotic increasing name for each category
	nameCounters   nameCounters
	signersCounter map[ThinUser]uint
}

// NewByzCoin creates a testing ByzCoin
func NewByzCoin(t *testing.T) ByzCoin {
	l := onet.NewTCPTest(cothority.Suite)
	servers := l.GenServers(3)
	roster := *l.GenRosterFromHost(servers...)

	admin := darc.NewSignerEd25519(nil, nil)

	genesisMsg, err := byzcoin.DefaultGenesisMsg(byzcoin.CurrentVersion, &roster, []string{
		"spawn:" + contracts.ContractCoinID,
		"spawn:" + personhood.ContractCredentialID,
		"invoke:" + contracts.ContractCoinID + ".mint",
	}, admin.Identity())
	require.NoError(t, err)

	client, _, err := byzcoin.NewLedger(genesisMsg, false)
	require.NoError(t, err)

	cl := *byzcoin.NewClient(client.ID, roster)
	cl.UseNode(0) // FIXME avoid timeout in tests, remove when LocalTest.CloseAll is fixed
	return ByzCoin{
		cas.Config{
			ByzCoinID: client.ID,
			Roster:    roster,

			ServiceToCoinInstanceIDs: make(map[string]skipchain.SkipBlockID),

			CoinCost:           1,
			TicketDecoder:      base64.URLEncoding.DecodeString,
			ChallengeSize:      20,
			ChallengeHasher:    func(data []byte) []byte { ret := sha256.Sum256(data); return ret[:] },
			TxArgumentName:     "challenge",
			TxValidityDuration: 5 * time.Minute,
		},
		NewThinUser(admin, genesisMsg.GenesisDarc.GetBaseID()),
		*l, t,
		cl,
		nameCounters{0, 0},
		make(map[ThinUser]uint),
	}
}

// Close ends the test
func (bc ByzCoin) Close() error {
	bc.localTest.CloseAll()
	return nil
}

// Run execute the given Instruction as the given User
func (bc ByzCoin) Run(user ThinUser, instrs ...byzcoin.Instruction) {
	signerCounter := bc.signersCounter[user]
	for i := range instrs {
		signerCounter++
		instrs[i].SignerCounter = []uint64{uint64(signerCounter)}
	}
	bc.signersCounter[user] = signerCounter

	ctx, err := bc.client.CreateTransaction(instrs...)
	require.NoError(bc.t, err)

	require.NoError(bc.t, ctx.FillSignersAndSignWith(user.Signer()))

	_, err = bc.client.AddTransactionAndWait(ctx, 5)
	require.NoError(bc.t, err)
}
