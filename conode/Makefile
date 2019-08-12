CONTAINER = conode-ol
IMAGE_NAME = c4dt/$(CONTAINER)
TAG = dev-$(shell date +%y%m%d)
WEBAPP_ASSET := ../webapp/src/assets/config.toml

# -s -w are for smaller binaries
# -X compiles the git tag into the binary
ldflags=-s -w -X main.gitTag=$(TAG)

all: docker

# Use this target to build from local source
docker: clean build/Dockerfile
	docker build -t $(IMAGE_NAME):$(TAG) -f build/Dockerfile build
	docker tag $(IMAGE_NAME):$(TAG) $(IMAGE_NAME):dev

cothority:
	git clone --depth 1 https://github.com/c4dt/cothority

cothority-pull: cothority
	cd cothority && git pull

newdb: cothority-pull
	@echo "Compiling binaries"; \
	rm -f build/conodes/*db; \
	export GO111MODULE=on; \
	cd cothority; \
		go build -o ../build/conode ./conode ; \
		go build -o ../build/bcadmin ./byzcoin/bcadmin
	@echo "Starting nodes"; \
	cp cothority/conode/run_nodes.sh build; \
	( cd build; COTHORITY_ALLOW_INSECURE_ADMIN=true ./run_nodes.sh -v 2 -t -n 4 -s -d conodes > /dev/null & )
	@echo "Waiting for nodes to start up"; sleep 10; \
	echo "Creating new ByzCoin and printing out important variables"; echo; \
	rm -f *.cfg; \
	( build/bcadmin -c . create build/conodes/public.toml --interval 500ms; \
	  build/bcadmin latest --bc bc-*; \
	  build/bcadmin key -print key-* ) | egrep "^(ByzCoin|Admin|Private)" | tee variables.txt
	build/bcadmin -c . config --interval 400ms bc-* key-*
	@sleep 5
	@echo; echo "Shutting down conodes"; pkill -x conode; rm build/conodes/running

docker_run:
	docker rm -f $(CONTAINER) || echo nothing to stop
	echo "ByzCoinID = \"$$( grep ByzCoinID variables.txt | sed -e 's/.* //' )\"" > $(WEBAPP_ASSET)
	echo >> $(WEBAPP_ASSET)
	cat build/conodes/public.toml >> $(WEBAPP_ASSET)
	docker run --rm -it -p 7770-7777:7770-7777 --name $(CONTAINER) $(IMAGE_NAME):dev

docker_stop:
	docker stop $(CONTAINER)

docker_start:
	docker start $(CONTAINER)

docker_clean:
	docker kill $(CONTAINER) || echo nothing to stop
	docker image ls $(IMAGE_NAME) -q | xargs docker rmi -f || echo done

clean:
	rm -rf build/conode
