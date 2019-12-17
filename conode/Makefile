CONTAINER = conode
IMAGE_NAME = c4dt/$(CONTAINER)
TAG = dev-$(shell date +%y%m%d)
WEBAPP_ASSET := ../webapp/src/assets/config.toml

all: docker

.PHONY: cothority-pull conode newdb docker docker_run docker_wait docker_stop docker_start docker_clean clean

.DEFAULT_GOAL := docker_run

utils: cothority-pull
	@echo "Compiling binaries"; \
	go build -o build/conode; \
	cd ../cothority && \
		go build -o ../conode/build/bcadmin ./byzcoin/bcadmin && \
		go build -o ../conode/build/csadmin ./calypso/csadmin && \
		go build -o ../conode/build/phapp ./personhood/phapp

cothority-pull:
	make -C .. cothority-pull

newdb: utils
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
docker: build/Dockerfile cothority-pull
	@export GO111MODULE=on GOOS=linux GOARCH=amd64; \
	go build -o build/conode
	docker build -t $(IMAGE_NAME):$(TAG) -f build/Dockerfile build
	docker tag $(IMAGE_NAME):$(TAG) $(IMAGE_NAME):dev

$(WEBAPP_ASSET): variables.txt build/conodes/public.toml
	 echo "ByzCoinID = \"$$( grep ByzCoinID $< | sed -e 's/.* //' )\"" > $@
	 echo >> $@
	 cat $(lastword $^) >> $@

docker_run: docker $(WEBAPP_ASSET)
	docker run --rm -ti -p 7770-7777:7770-7777 --name $(CONTAINER) $(IMAGE_NAME):dev

docker_run_travis: docker
	docker run --rm -p 7770-7777:7770-7777 --name $(CONTAINER) $(IMAGE_NAME):dev

docker_wait:
	@for port in $$( seq 7771 2 7777 ); do \
	  echo "Waiting for localhost:$$port"; \
	  until curl -s http://localhost:$$port/ok > /dev/null; do sleep .2; done; \
	done

docker_stop:
	docker stop $(CONTAINER)

docker_start:
	docker start $(CONTAINER)

docker_clean:
	docker kill $(CONTAINER) || echo nothing to stop
	docker image ls $(IMAGE_NAME) -q | xargs docker rmi -f || echo done

clean:
	rm -rf build/conode
