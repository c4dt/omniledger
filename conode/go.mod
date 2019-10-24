module github.com/c4dt/omniledger/conode

require (
	github.com/cpuguy83/go-md2man/v2 v2.0.0 // indirect
	github.com/gorilla/websocket v1.4.1 // indirect
	github.com/urfave/cli v1.22.1
	go.dedis.ch/cothority/v4 v4.0.0-20191024075351-deb5ea40a851
	go.dedis.ch/kyber/v4 v4.0.0-pre1
	go.dedis.ch/onet/v4 v4.0.0-pre1
	golang.org/x/crypto v0.0.0-20191011191535-87dc89f01550 // indirect
	golang.org/x/net v0.0.0-20191021144547-ec77196f6094 // indirect
	golang.org/x/sys v0.0.0-20191024073052-e66fe6eb8e0c // indirect
	google.golang.org/appengine v1.6.5 // indirect
	gopkg.in/square/go-jose.v2 v2.4.0 // indirect
)

replace go.dedis.ch/cothority/v4 => ./cothority

go 1.13
