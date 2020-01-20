.DEFAULT_GOAL := build_serve

../dynacred/build/index.js:
	make -C ../dynacred

deps: ../dynacred/build/index.js
	npm ci

dynacred-src:
	make -C ../dynacred src

.PHONY: src
src: dynacred-src src/lib/cothority src/lib/kyber

src/lib:
	mkdir -p src/lib

src/lib/cothority: src/lib
	ln -s $$(pwd)/../cothority/external/js/cothority/src src/lib/cothority

src/lib/kyber: src/lib
	ln -s $$(pwd)/../cothority/external/js/kyber/src src/lib/kyber

npm:
	make -C ../dynacred npm
	rm -f src/lib/{cothority,kyber}

serve:
	ng serve --disable-host-check --aot

build_serve: deps serve
