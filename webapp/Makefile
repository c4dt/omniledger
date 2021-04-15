.DEFAULT_GOAL := build_serve

../dynacred/build/index.js:
	make -C ../dynacred

deps: ../dynacred/build/index.js
	npm ci

dynacred-src:
	make -C ../dynacred src

src/assets/config.toml:
	cp src/assets/config.dedis.toml src/assets/config.toml

serve: src/assets/config.toml
	npx ng serve --disable-host-check --watch

build_serve: deps serve
