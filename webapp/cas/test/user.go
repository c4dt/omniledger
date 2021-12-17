package test

import (
	"encoding/binary"
	"encoding/hex"
	"fmt"

	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/byzcoin/contracts"
	"go.dedis.ch/cothority/v3/darc"
	"go.dedis.ch/cothority/v3/darc/expression"
	personhood "go.dedis.ch/cothority/v3/personhood/contracts"
	"go.dedis.ch/onet/v3/log"
	"go.dedis.ch/protobuf"

	"github.com/stretchr/testify/require"
)

// ThinUser is a user with a single DARC
type ThinUser interface {
	Signer() darc.Signer
	Darc() byzcoin.InstanceID
}

type thinUser struct {
	signer darc.Signer
	darc   byzcoin.InstanceID
}

func (u thinUser) Signer() darc.Signer {
	return u.signer
}

func (u thinUser) Darc() byzcoin.InstanceID {
	return u.darc
}

// NewThinUser creates a ThinUser
func NewThinUser(signer darc.Signer, darc []byte) ThinUser {
	return thinUser{signer, byzcoin.NewInstanceID(darc)}
}

type coinActor byzcoin.InstanceID

func (c coinActor) Transfer(amount uint, to coinActor) byzcoin.Instruction {
	var coinCost [8]byte
	binary.LittleEndian.PutUint64(coinCost[:], uint64(amount))

	return byzcoin.Instruction{
		InstanceID: byzcoin.InstanceID(c),
		Invoke: &byzcoin.Invoke{
			ContractID: contracts.ContractCoinID,
			Command:    "transfer",
			Args: byzcoin.Arguments{
				coinAmountToArgument(amount),
				{
					Name:  "destination",
					Value: byzcoin.InstanceID(to).Slice(),
				}},
		},
	}
}

// User is a ThinUser with a coin instance and some credentials
type User struct {
	ThinUser

	Coin  coinActor
	Creds byzcoin.InstanceID
}

// UserBuilder helps building User
type UserBuilder struct {
	coinAmount uint
}

// NewUser create a User builder
func NewUser() UserBuilder {
	return UserBuilder{}
}

// WithCoinReserve set the initial coints of the user
func (b UserBuilder) WithCoinReserve(amount uint) UserBuilder {
	return UserBuilder{amount}
}

// RunsOn creates the User on this ByzCoin
func (b UserBuilder) RunsOn(bc ByzCoin) User {
	bc.nameCounters.User++
	name := fmt.Sprintf("user-%d", bc.nameCounters.User)

	newUser := darc.NewSignerEd25519(nil, nil)
	newUserID := newUser.Identity()

	// main darc

	rules := darc.InitRules([]darc.Identity{newUserID}, []darc.Identity{newUserID})
	for _, s := range []string{
		personhood.ContractCredentialID + ".update",
		contracts.ContractCoinID + ".fetch",
		contracts.ContractCoinID + ".transfer",
	} {
		rules.AddRule(darc.Action("invoke:"+s), expression.Expr(newUserID.String()))
	}
	rules.AddRule(
		darc.Action("invoke:"+contracts.ContractCoinID+".mint"),
		expression.Expr(bc.Admin.Signer().Identity().String()),
	)
	d := *darc.NewDarc(rules, []byte(name))
	dBuf, err := d.ToProto()
	require.NoError(bc.t, err)

	darcIID := d.GetBaseID()
	coinIID := iid(contracts.ContractCoinID, d)
	credIID := iid(personhood.ContractCredentialID, d)

	cred := personhood.CredentialStruct{
		Credentials: []personhood.Credential{{
			Name: "1-public",
			Attributes: []personhood.Attribute{{
				Name:  "alias",
				Value: []byte(name),
			}, {
				Name:  "coin",
				Value: coinIID.Slice(),
			}},
		}},
	}
	credBuf, err := protobuf.Encode(&cred)
	require.NoError(bc.t, err)

	log.Infof("Creating Darc for %s: %x", name, darcIID)
	log.Infof("Creating Coin for %s: %s", name, hex.EncodeToString(coinIID.Slice()))
	log.Infof("Creating Credentials for %s: %s", name, hex.EncodeToString(credIID.Slice()))

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
		}}, byzcoin.Instruction{
		InstanceID: coinIID,
		Invoke: &byzcoin.Invoke{
			ContractID: contracts.ContractCoinID,
			Command:    "mint",
			Args: byzcoin.Arguments{
				coinAmountToArgument(b.coinAmount),
			},
		}}, byzcoin.Instruction{
		InstanceID: bc.Admin.Darc(),
		Spawn: &byzcoin.Spawn{
			ContractID: personhood.ContractCredentialID,
			Args: byzcoin.Arguments{{
				Name:  "darcIDBuf",
				Value: darcIID,
			}, {
				Name:  "credentialID",
				Value: darcIID,
			}, {
				Name:  "credential",
				Value: credBuf,
			}},
		},
	})

	log.Info("User should be correctly registered")

	thinUser := NewThinUser(newUser, d.GetBaseID())
	return User{thinUser, coinActor(coinIID), credIID}
}

func coinAmountToArgument(amount uint) byzcoin.Argument {
	var coinCost [8]byte
	binary.LittleEndian.PutUint64(coinCost[:], uint64(amount))

	return byzcoin.Argument{
		Name:  "coins",
		Value: coinCost[:],
	}
}
