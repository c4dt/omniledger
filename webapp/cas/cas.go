package main

type CAS struct {
	Config Config
	Client Client
}

func NewCAS(conf Config) CAS {
	return CAS{
		conf,
		NewClient(conf),
	}
}
