module github.com/c4dt/omniledger/webapp/cas

go 1.12

require (
	github.com/gin-gonic/gin v1.4.0
	github.com/pelletier/go-toml v1.4.0
	github.com/sclevine/agouti v3.0.0+incompatible
	github.com/stretchr/testify v1.4.0
	github.com/urfave/cli v1.22.1
	go.dedis.ch/cothority/v3 v3.2.0
	go.dedis.ch/kyber/v3 v3.0.5
	go.dedis.ch/onet/v3 v3.0.24
	go.dedis.ch/protobuf v1.0.8
)

replace go.dedis.ch/cothority/v3 v3.2.0 => go.dedis.ch/cothority/v3 v3.2.1-0.20190911105735-f32902e2bace
