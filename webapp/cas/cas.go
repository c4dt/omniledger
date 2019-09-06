package cas

// CAS implement some CAS calls.
type CAS struct {
	Config Config
	Client Client
}

// NewCAS is the way to initialize it.
func NewCAS(conf Config) CAS {
	return CAS{
		conf,
		NewClient(conf),
	}
}
