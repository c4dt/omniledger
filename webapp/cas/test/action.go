package test

import (
	"encoding/hex"
	"fmt"

	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/byzcoin/contracts"
	"go.dedis.ch/cothority/v3/darc"
	"go.dedis.ch/cothority/v3/darc/expression"
	personhood "go.dedis.ch/cothority/v3/personhood/contracts"
	"go.dedis.ch/onet/v3/log"

	"github.com/stretchr/testify/require"
)

// Action is a specialisation of a DARC that an user can do
type Action struct {
	Darc byzcoin.InstanceID
	Coin coinActor
}

// ActionBuilder helps building Action
type ActionBuilder struct {
	user User
}

// NewAction start a builder of an Action
func NewAction() ActionBuilder {
	return ActionBuilder{}
}

// CanBeUsedBy set the User that can use the Action
func (b ActionBuilder) CanBeUsedBy(user User) ActionBuilder {
	return ActionBuilder{user}
}

// RunsOn actually create the action on the given ByzCoin
func (b ActionBuilder) RunsOn(bc ByzCoin) Action {
	bc.nameCounters.Action++
	name := fmt.Sprintf("action-%d", bc.nameCounters.Action)

	newAction := darc.NewSignerEd25519(nil, nil)
	newActionID := newAction.Identity()

	userDarcIdentity := darc.NewIdentityDarc(darc.ID(b.user.Darc().Slice()))
	rules := darc.InitRules([]darc.Identity{newActionID}, []darc.Identity{newActionID})
	rules.AddRule(
		"invoke:"+contracts.ContractCoinID+".transfer",
		expression.Expr(userDarcIdentity.String()),
	)
	d := *darc.NewDarc(rules, []byte(name))
	dBuf, err := d.ToProto()
	require.NoError(bc.t, err)

	darcIID := d.GetBaseID()
	coinIID := iid(contracts.ContractCoinID, d)

	log.Infof("Creating Darc for %s: %x", name, darcIID)
	log.Infof("Creating Coin for %s: %s", name, hex.EncodeToString(coinIID.Slice()))
	bc.Run(bc.Admin, byzcoin.Instruction{
		InstanceID: bc.Admin.Darc(),
		Spawn: &byzcoin.Spawn{
			ContractID: byzcoin.ContractDarcID,
			Args: byzcoin.Arguments{{
				Name:  "darc",
				Value: dBuf,
			}},
		}}, byzcoin.Instruction{
		InstanceID: bc.Admin.Darc(),
		Spawn: &byzcoin.Spawn{
			ContractID: contracts.ContractCoinID,
			Args: byzcoin.Arguments{{
				Name:  "type",
				Value: personhood.SpawnerCoin.Slice(),
			}, {
				Name:  "coinID",
				Value: darcIID,
			}, {
				Name:  "darcID",
				Value: darcIID,
			}},
		}})

	return Action{byzcoin.NewInstanceID(d.GetBaseID()), coinActor(coinIID)}
}
