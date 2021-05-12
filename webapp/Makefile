.DEFAULT_GOAL := serve_local
.NOTPARALLEL: serve docker_start

.PHONY: deps dynacred-src serve docker_start serve_local serve_dedis

../dynacred/build/index.js:
	make -C ../dynacred

deps: ../dynacred/build/index.js
	npm ci

dynacred-src:
	make -C ../dynacred src

src/assets/config.toml:
	cp src/assets/config.dedis.toml src/assets/config.toml

serve:
	[ -n "$(CONFIG)" ]
	cp src/assets/config.$(CONFIG).toml src/assets/config.toml
	npx ng serve --disable-host-check --watch

docker_start:
	make -C ../conode docker_start_detached

serve_local: CONFIG=local
serve_local: docker_start serve

serve_dedis: CONFIG=dedis
serve_dedis: serve
