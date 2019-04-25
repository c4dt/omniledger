CONTAINER = conode
IMAGE_NAME = dedis/$(CONTAINER)
DATA_DIR = $(shell pwd)/conode_data
GITUNTRACKEDCHANGES := $(shell git status --porcelain --untracked-files=no)
TAG = dev-$(shell date +%y%m%d)
GIT_TAG = $(shell git tag -l --points-at HEAD )
ifneq ($(GIT_TAG),)
  TAG = $(GIT_TAG)
endif
OUTPUT_DIR = conode-$(TAG)

# -s -w are for smaller binaries
# -X compiles the git tag into the binary
ldflags=-s -w -X main.gitTag=$(TAG)

.PHONY: docker

all: docker

# Use this target to build from local source
docker: clean build/Dockerfile build/conode.Linux.x86_64
	test -d cothority || git clone --depth 1 -b personhood_1904 https://github.com/dedis/cothority
	docker build -t $(IMAGE_NAME):$(TAG) -f build/Dockerfile build
	docker tag $(IMAGE_NAME):$(TAG) $(IMAGE_NAME):dev

newdb: clean build/Dockerfile build/conode.Linux.x86_64
	rm -rf builddb
	mkdir builddb
	cp build/conode* builddb/conode
	cd cothority; \
	    go build -o ../build/bcadmin ./byzcoin/bcadmin; \
	    go build -o ../build/phapp ./personhood/phapp
	COTHORITY_ALLOW_INSECURE_ADMIN=true ./run_nodes.sh -v 2 -t -n 4 -d build/conodes
	rm *.cfg
	cd build; \
	    ./bcadmin -c .. create conodes/public.toml --interval 500ms; \
	    ./phapp spawner ../bc-* ../key-*; \
	    ./bcadmin latest --bc ../bc-*; \
	    ./bcadmin key -print ../key-*


docker_run:
	if [ ! -f conode_data/private.toml ]; then make docker_setup; fi
	mkdir -p $(DATA_DIR)
	docker run -it --rm -p 7770-7771:7770-7771 --name $(CONTAINER) -v $(DATA_DIR):/conode_data \
		$(IMAGE_NAME):dev

docker_stop:
	docker rm -f $(CONTAINER)

docker_clean:
	docker kill $(CONTAINER) || echo nothing to stop
	docker image ls $(IMAGE_NAME) -q | xargs docker rmi -f || echo done

# The suffix on conode exe is the result from: echo `uname -s`.`uname -m`
# so that we can find the right one in the wrapper script.
# This is in it's own rule because the Docker build needs it also.
build/conode.Linux.x86_64:
	GO111MODULE=on GOOS=linux GOARCH=amd64 go build -ldflags="$(ldflags)" -o $@

clean:
	rm -rf build/conode* $(OUTPUT_DIR)
