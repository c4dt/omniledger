module github.com/c4dt/omniledger/conode

require (
	github.com/urfave/cli v1.22.3
	go.dedis.ch/cothority/v3 v3.3.2
	go.dedis.ch/kyber/v3 v3.0.12
	go.dedis.ch/onet/v3 v3.2.2
)

replace go.dedis.ch/cothority/v3 => ../cothority

go 1.13
