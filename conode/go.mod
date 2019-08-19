module github.com/c4dt/omniledger/mobile/conode

require (
	github.com/BurntSushi/toml v0.3.1
	github.com/bford/golang-x-crypto v0.0.0-20160518072526-27db609c9d03
	github.com/coreos/go-oidc v2.0.0+incompatible
	github.com/pkg/browser v0.0.0-20180916011732-0a3d74bf9ce4
	github.com/prataprc/goparsec v0.0.0-20180806094145-2600a2a4a410
	github.com/qantik/qrgo v0.0.0-20160917134849-0c6b902c59f6
	github.com/satori/go.uuid v1.2.0
	github.com/stretchr/testify v1.3.0
	go.dedis.ch/cothority/v3 v3.1.3
	go.dedis.ch/kyber/v3 v3.0.4
	go.dedis.ch/onet/v3 v3.0.21
	go.dedis.ch/protobuf v1.0.6
	go.etcd.io/bbolt v1.3.2
	golang.org/x/oauth2 v0.0.0-20190115181402-5dab4167f31c
	golang.org/x/sys v0.0.0-20190322080309-f49334f85ddc
	gopkg.in/satori/go.uuid.v1 v1.2.0
	gopkg.in/urfave/cli.v1 v1.20.0
)

replace go.dedis.ch/cothority/v3 => ./cothority
