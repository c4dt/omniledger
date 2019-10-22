module github.com/c4dt/omniledger/mobile/conode

require (
	github.com/BurntSushi/toml v0.3.1
	github.com/bford/golang-x-crypto v0.0.0-20160518072526-27db609c9d03
	github.com/coreos/go-oidc v2.1.0+incompatible
	github.com/pkg/browser v0.0.0-20180916011732-0a3d74bf9ce4
	github.com/prataprc/goparsec v0.0.0-20180806094145-2600a2a4a410
	github.com/qantik/qrgo v0.0.0-20160917134849-0c6b902c59f6
	github.com/satori/go.uuid v1.2.0
	github.com/stretchr/testify v1.4.0
	go.dedis.ch/cothority/v3 v3.1.3
	go.dedis.ch/kyber/v3 v3.0.6
	go.dedis.ch/onet/v3 v3.0.26
	go.dedis.ch/protobuf v1.0.9
	go.etcd.io/bbolt v1.3.3
	golang.org/x/oauth2 v0.0.0-20190604053449-0f29369cfe45
	golang.org/x/sys v0.0.0-20190912141932-bc967efca4b8
	gopkg.in/satori/go.uuid.v1 v1.2.0
	gopkg.in/urfave/cli.v1 v1.20.0
)

replace go.dedis.ch/cothority/v3 => ./cothority

go 1.13
