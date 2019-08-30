none:
	@echo "Not breaking if you don't tell me what to do"

cothority_src: cothority-pull src/lib/cothority

src/lib/cothority: cothority/external/js/cothority/src
	@mkdir -p src/lib
	@cp -a $< $@
	@find src/ -name "*.ts" | xargs perl -pi -e "s:\@c4dt/cothority:src/lib/cothority:"
	@find spec/ -name "*.ts" | xargs perl -pi -e "s:\@c4dt/cothority:src/lib/cothority:"

cothority_npm: cothority-pull
	@echo "Using cothority-npm libraries"
	@if [ ! -d src/lib/cothority ]; then \
		echo "there is no cothority-source present, aborting"; \
		exit 1; \
	fi
	@diff -Naurq cothority/external/js/cothority/src/ src/lib/cothority/ || \
		( echo "Moving changes to cothority"; cp -a src/lib/cothority/ cothority/external/js/cothority/src )
	@rm -rf src/lib/cothority
	@find src/ -name "*.ts" | xargs perl -pi -e "s:src/lib/cothority:\@c4dt/cothority:"
	@find spec/ -name "*.ts" | xargs perl -pi -e "s:src/lib/cothority:\@c4dt/cothority:"

cothority:
	git clone --depth=1 https://github.com/c4dt/cothority

cothority-pull: cothority
	cd cothority && git pull

kyber_src: cothority-pull src/lib/kyber

src/lib/kyber: cothority/external/js/kyber/src
	@cp -a $< $@
	@find src/ -name "*.ts" | xargs perl -pi -e "s:\@dedis/kyber:src/lib/kyber:"

kyber_npm:
	@echo "Using kyber-npm libraries"
	@if [ ! -d src/lib/kyber ]; then \
		echo "there is no kyber-source present, aborting"; \
		exit 1; \
	fi
	@diff -Naurq cothority/external/js/kyber/src/ src/lib/kyber/ || \
		( echo "Moving changes to kyber"; cp -a src/lib/kyber/ cothority/external/js/kyber/src )
	@rm -rf src/lib/kyber
	@find src/ -name "*.ts" | xargs perl -pi -e "s:src/lib/kyber:\@dedis/kyber:"
