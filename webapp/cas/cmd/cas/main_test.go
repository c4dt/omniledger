package main

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/c4dt/omniledger/webapp/cas"
	"go.dedis.ch/cothority/v3/byzcoin"
	"go.dedis.ch/cothority/v3/skipchain"

	"github.com/c4dt/omniledger/webapp/cas/test"
	"github.com/stretchr/testify/require"
)

func TestServiceValidate(t *testing.T) {
	bc := test.NewByzCoin(t)
	defer bc.Close()

	user1 := test.NewUser().WithCoinReserve(bc.Config.CoinCost).RunsOn(bc)
	action := test.NewAction().CanBeUsedBy(user1).RunsOn(bc)

	bc.Config.ServiceToCoinInstanceIDs["http://localhost"] =
		skipchain.SkipBlockID(byzcoin.InstanceID(action.Coin).Slice())

	cas := cas.NewCAS(bc.Config)
	router := getRouter(cas)

	putChallenge := func(t *testing.T, user test.User, action test.Action) []byte {
		challenge := make([]byte, bc.Config.ChallengeSize)
		_, err := rand.Read(challenge)
		require.NoError(t, err)

		sendCoin := user.Coin.Transfer(bc.Config.CoinCost, action.Coin)
		recvCoin := action.Coin.Transfer(bc.Config.CoinCost, user.Coin)
		recvCoin.Invoke.Args = append(recvCoin.Invoke.Args, byzcoin.Argument{
			Name:  bc.Config.TxArgumentName,
			Value: bc.Config.ChallengeHasher(challenge),
		})
		bc.Run(user, sendCoin, recvCoin)

		return challenge
	}

	requireAuthContaining := func(t *testing.T, toMatch string, challenge []byte, user test.User) {
		ticket := append([]byte{}, challenge...)
		ticket = append(ticket, user.Creds.Slice()...)
		url := "/api/v0/cas/p3/serviceValidate?service=http://localhost&" +
			"ticket=ST-" + base64.URLEncoding.EncodeToString(ticket)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", url, nil)
		router.ServeHTTP(w, req)

		require.Equal(t, 200, w.Code)
		require.Contains(t, w.Body.String(), toMatch)
	}
	requireAuthFailure := func(t *testing.T, c []byte, u test.User) { requireAuthContaining(t, "</authenticationFailure>", c, u) }
	requireAuthSuccess := func(t *testing.T, c []byte, u test.User) { requireAuthContaining(t, "<authenticationSuccess>", c, u) }

	t.Run("with ByzCoin", func(t *testing.T) {
		t.Run("Working login", func(t *testing.T) {
			t.Parallel()
			challenge := putChallenge(t, user1, action)
			requireAuthSuccess(t, challenge, user1)
		})

		t.Run("User not in Action", func(t *testing.T) {
			t.Parallel()
			user2 := test.NewUser().WithCoinReserve(bc.Config.CoinCost).RunsOn(bc)
			requireAuthFailure(t, nil, user2)
		})
	})
}
