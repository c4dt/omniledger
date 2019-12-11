.DEFAULT_GOAL := build_serve

deps:
	npm ci

src:
	make -C ../dynacred use_src
	ln -s $$(pwd)/../cothority/external/js/cothority/src src/lib/cothority
	ln -s $$(pwd)/../cothority/external/js/kyber/src src/lib/kyber

npm:
	make -C ../dynacred use_npm
	rm -f src/lib/{cothority,kyber}

serve:
	ng serve --disable-host-check --aot

build_serve: deps serve
