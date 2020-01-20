deps:
	npm ci

none:
	@echo "Not breaking if you don't tell me what to do"

cothority-pull:
	make -C .. cothority-pull

.PHONY: src
src: cothority-pull src/lib/cothority src/lib/kyber

src/lib:
	mkdir -p src/lib

src/lib/cothority: src/lib
	ln -s $$(pwd)/../cothority/external/js/cothority/src src/lib/cothority

src/lib/kyber: src/lib
	ln -s $$(pwd)/../cothority/external/js/kyber/src src/lib/kyber

npm:
	rm -f src/lib/{cothority,kyber}

