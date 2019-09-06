cas: cmd/cas/main.go $(wildcard *.go)
	go build -o $@ ./$(dir $<)

login.png: login.uml
	plantuml $^
