module github.com/c4dt/omniledger/webapp/cas

go 1.12

require (
	github.com/gin-gonic/gin v1.4.0
	github.com/pelletier/go-toml v1.4.0
	github.com/stretchr/testify v1.3.0
	go.dedis.ch/cothority/v3 v3.1.3
	go.dedis.ch/kyber/v3 v3.0.4
	go.dedis.ch/onet/v3 v3.0.21
	go.dedis.ch/protobuf v1.0.6
)

replace go.dedis.ch/cothority/v3 v3.1.3 => go.dedis.ch/cothority/v3 v3.1.4-0.20190903071729-48c5f9e70c28
