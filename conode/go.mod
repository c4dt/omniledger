module github.com/dedis/dynasent/conode

go 1.12

require (
	go.dedis.ch/cothority/v3 v3.0.4
	go.dedis.ch/kyber/v3 v3.0.3
	go.dedis.ch/onet/v3 v3.0.9
	golang.org/x/sys v0.0.0-20190425045458-9f0b1ff7b46a
	gopkg.in/urfave/cli.v1 v1.20.0
)

replace go.dedis.ch/cothority/v3 => ./cothority
