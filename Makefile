.PHONY: src npm clean

cothority:
	git clone https://github.com/dedis/cothority --depth 1

src: cothority
	cd cothority && git pull && \
	  cd external/js/kyber && npm ci && \
	  cd ../cothority && npm ci
	cd dynacred && npm ci
	cd webapp && npm ci

npm:
	rm -rf cothority

clean:
	rm -rf cothority
	rm -rf {webapp,dynacred}/node_modules
