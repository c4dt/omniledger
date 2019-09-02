COT := \@c4dt/cothority

none:
	@echo "Not breaking if you don't tell me what to do"

cothority_src: dynacred_src cothority-pull src/lib/cothority

src/lib/cothority: cothority/external/js/cothority/src
	@cp -a $< $@
	@find src/ -name "*.ts" | xargs perl -pi -e "s:${COT}:src/lib/cothority:"

cothority_npm: kyber_npm
	@echo "Using cothority-npm libraries"
	@if [ ! -d src/lib/cothority ]; then \
		echo "there is no cothority-source present"; \
		exit 0; \
	fi; \
	diff -Naurq cothority/external/js/cothority/src/ src/lib/cothority/ || \
		( echo "Moving changes to cothority"; cp -a src/lib/cothority/ cothority/external/js/cothority/src ); \
	rm -rf src/lib/cothority; \
	find src/ -name "*.ts" | xargs perl -pi -e "s:src/lib/cothority:${COT}:"

cothority:
	git clone https://github.com/c4dt/cothority

cothority-pull: cothority
	cd cothority && git pull

kyber_src: cothority_src cothority-pull src/lib/kyber

src/lib/kyber: cothority/external/js/kyber/src
	@cp -a $< $@
	@find src/ -name "*.ts" | xargs perl -pi -e "s:\@dedis/kyber:src/lib/kyber:"

kyber_npm:
	@echo "Using kyber-npm libraries"
	@if [ ! -d src/lib/kyber ]; then \
		echo "there is no kyber-source present, aborting"; \
		exit 0; \
	fi; \
	diff -Naurq cothority/external/js/kyber/src/ src/lib/kyber/ || \
		( echo "Moving changes to kyber"; cp -a src/lib/kyber/ cothority/external/js/kyber/src ); \
	rm -rf src/lib/kyber; \
	find src/ -name "*.ts" | xargs perl -pi -e "s:src/lib/kyber:\@dedis/kyber:"

dynacred_src: src/lib/dynacred

src/lib/dynacred: ../dynacred/src
	@cp -a $< $@
	@find src/ -name "*.ts" | xargs perl -pi -e "s:\@c4dt/dynacred:src/lib/dynacred:"

dynacred_npm: cothority_npm
	@echo "Using dynacred-npm libraries"
	@if [ ! -d src/lib/dynacred ]; then \
		echo "there is no dynacred-source present, aborting"; \
		exit 0; \
	fi; \
	diff -Naurq ../dynacred/src/ src/lib/dynacred/ || \
		( echo "Moving changes to dynacred"; cp -a src/lib/dynacred/ ../dynacred/src ); \
	rm -rf src/lib/dynacred; \
	find src/ -name "*.ts" | xargs perl -pi -e "s:src/lib/dynacred:\@c4dt/dynacred:"
	cd ../dynacred; npm run lint:fix

src: cothority_src

npm: dynacred_npm

serve:
	ng serve --disable-host-check --aot
