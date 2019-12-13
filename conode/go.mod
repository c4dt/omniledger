module github.com/c4dt/omniledger/conode

require (
	github.com/cpuguy83/go-md2man/v2 v2.0.0 // indirect
	github.com/gorilla/websocket v1.4.1 // indirect
	github.com/urfave/cli v1.22.1
	go.dedis.ch/cothority/v3 v3.3.2
	go.dedis.ch/kyber/v3 v3.0.11
	go.dedis.ch/onet/v3 v3.0.31
	golang.org/x/crypto v0.0.0-20191011191535-87dc89f01550 // indirect
	golang.org/x/sys v0.0.0-20191024073052-e66fe6eb8e0c // indirect
	google.golang.org/appengine v1.6.5 // indirect
)

replace go.dedis.ch/cothority/v3 => ../cothority

go 1.13
