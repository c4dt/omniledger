.PHONY: all
all: cas cas-stress

%: cmd/%/main.go $(wildcard *.go)
	go build -o $@ ./$(dir $<)

login.png: login.uml
	plantuml $^
