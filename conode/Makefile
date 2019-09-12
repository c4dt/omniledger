CONTAINER = conode
IMAGE_NAME = c4dt/$(CONTAINER)
TAG = dev-$(shell date +%y%m%d)
WEBAPP_ASSET := ../webapp/src/assets/config.toml

all: docker

cothority:
	git clone --depth 1 https://github.com/c4dt/cothority

conode: cothority
	@( cd cothority; git pull )
	@echo "Compiling binaries"; \
	go build -o build/conode; \
	cd cothority; \
		go build -o ../build/bcadmin ./byzcoin/bcadmin; \
		go build -o ../build/csadmin ./calypso/csadmin; \
		go build -o ../build/phapp ./personhood/phapp

newdb: conode
	rm -f build/conodes/*db;
	@echo "Starting nodes"; \
	( cd build; COTHORITY_ALLOW_INSECURE_ADMIN=true ./run_nodes.sh -v 2 -t -n 4 -s -d conodes > /dev/null ) & \
	make docker_wait; \
	echo "Creating new ByzCoin and printing out important variables"; echo; \
	rm -f *.cfg; \
	( ./build/bcadmin -c . create build/conodes/public.toml --interval 500ms; \
	  ./build/bcadmin latest --bc bc-*; \
	  ./build/bcadmin key -print key-* ) | egrep "^(ByzCoin|Admin|Private|Creating Spawner)" | tee variables.txt; \
	echo; echo "Shutting down conodes"; pkill -x conode; rm -f conodes/running

# Use this target to build from local source
docker: build/Dockerfile cothority
	@export GO111MODULE=on GOOS=linux GOARCH=amd64; \
	go build -o build/conode; \
	cd cothority; \
		go build -o ../build/bcadmin ./byzcoin/bcadmin; \
		go build -o ../build/csadmin ./calypso/csadmin
	docker build -t $(IMAGE_NAME):$(TAG) -f build/Dockerfile build
	docker tag $(IMAGE_NAME):$(TAG) $(IMAGE_NAME):dev

docker_run: docker
	docker rm -f $(CONTAINER) || echo nothing to stop
	echo "ByzCoinID = \"$$( grep ByzCoinID variables.txt | sed -e 's/.* //' )\"" > $(WEBAPP_ASSET)
	echo >> $(WEBAPP_ASSET)
	cat build/conodes/public.toml >> $(WEBAPP_ASSET)
	docker run --rm -t -p 7770-7777:7770-7777 --name $(CONTAINER) $(IMAGE_NAME):dev

docker_wait:
	@for port in $$( seq 7771 2 7777 ); do \
	  echo "Waiting for localhost:$$port"; \
	  until curl -s http://localhost:$$port/ok > /dev/null; do sleep .2; done; \
	done

docker_start:
	docker start $(CONTAINER)

docker_stop:
	docker stop $(CONTAINER)

docker_clean:
	docker kill $(CONTAINER) || echo nothing to stop
	docker image ls $(IMAGE_NAME) -q | xargs docker rmi -f || echo done

clean:
	rm -rf build/conode cothority

run_local: conode
	cd build; \
	if [ ! -d local ]; then cp -a conodes local; fi; \
	COTHORITY_ALLOW_INSECURE_ADMIN=true ./run_nodes.sh -v 2 -c -n 4 -d local/
