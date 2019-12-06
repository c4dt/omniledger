none:
	@echo "Not breaking if you don't tell me what to do"

use_src:
	make -C ../dynacred use_src
	ln -s ../../../cothority/external/js/cothority/src src/lib/cothority
	ln -s ../../../cothority/external/js/kyber/src src/lib/kyber

use_npm:
	make -C ../dynacred use_npm
	rm -f src/lib/{cothority,kyber}

serve:
	ng serve --disable-host-check --aot
