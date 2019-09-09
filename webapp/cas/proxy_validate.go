package cas

// ProxyValidateXML implement cas:/proxyValidate
func (cas CAS) ProxyValidateXML(urlRaw, ticket string) tXML {
	return cas.ServiceValidateXML(urlRaw, ticket)
}
