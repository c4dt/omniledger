COT := c4dt/cothority

none:
	@echo "Not breaking if you don't tell me what to do"

cothority_src: cothority-pull src/lib/cothority

src/lib/cothority: cothority/external/js/cothority/src
	@mkdir -p src/lib
	@ln -s ../../$< $@
	@find src/lib/cothority/ -name "*.ts" | xargs perl -pi -e "s:\"crypto\":\"crypto-browserify\":"

cothority_npm: cothority-pull
	@echo "Using cothority-npm libraries"
	@if [ ! -d src/lib/cothority ]; then \
		echo "there is no cothority-source present, aborting"; \
		exit 1; \
	fi
	@find src/lib/cothority -name "*.ts" | xargs perl -pi -e "s:\"crypto-browserify\":\"crypto\":"
	@rm -f src/lib/cothority
	@rmdir src/lib

cothority:
	git clone --depth=1 https://github.com/${COT}

cothority-pull: cothority
	cd cothority && git pull

kyber_src: cothority-pull src/lib/kyber

src/lib/kyber: cothority/external/js/kyber/src
	@cp -a $< $@
	@find src/ -name "*.ts" | xargs perl -pi -e "s:\@c4dt/kyber:src/lib/kyber:"

kyber_npm:
	@echo "Using kyber-npm libraries"
	@if [ ! -d src/lib/kyber ]; then \
		echo "there is no kyber-source present, aborting"; \
		exit 1; \
	fi
	@diff -Naurq cothority/external/js/kyber/src/ src/lib/kyber/ || \
		( echo "Moving changes to kyber"; cp -a src/lib/kyber/ cothority/external/js/kyber/src )
	@rm -rf src/lib/kyber
	@find src/ -name "*.ts" | xargs perl -pi -e "s:src/lib/kyber:\@c4dt/kyber:"
