CONTAINER = conode
IMAGE_NAME = c4dt/$(CONTAINER)
TAG = dev-$(shell date +%y%m%d)
WEBAPP_ASSET := ../webapp/src/assets/config.local.toml
VARIABLES := variables.txt

.PHONY: build docker docker_start docker_start_detached docker_wait docker_stop docker_clean clean

$(VARIABLES): build/Dockerfile build/run_nodes.sh
	$(MAKE) clean docker
	@echo "Starting nodes"
	docker run -di -v $$(pwd)/build/conodes:/root/conodes --name newdb -p 7770-7777:7770-7777 \
		$(IMAGE_NAME):dev bash -c \
		"COTHORITY_ALLOW_INSECURE_ADMIN=true ./run_nodes.sh -n 4 -v 2 -c -d /root/conodes"
	$(MAKE) docker_wait

	@echo "Creating new ByzCoin and printing out important variables"
	docker exec newdb ./bcadmin -c conodes create conodes/public.toml --interval 500ms | tee $@
	docker exec newdb bash -c './bcadmin key -print $$(ls conodes/key*)' | tee -a $@
	docker exec newdb bash -c './bcadmin info --bc $$(ls conodes/bc*)' | grep AdminDarc | tee -a $@
	docker exec newdb chmod -R a+r /root/conodes

# This only works with the changes from May 2021 in cothority
#	docker exec -ti newdb bash -c \
#		'./bcadmin -c conodes/ user new --base-url http://localhost:4200/register/device \
#		conodes/bc-* conodes/key-* admin' > newuser.txt

	@echo "Shutting down conodes"; docker rm -f newdb
	$(MAKE) docker $(WEBAPP_ASSET)

$(WEBAPP_ASSET): build/conodes/public.toml
	 echo "ByzCoinID = \"$$( ls build/conodes/bc-* | sed -e 's/.*bc-\(.*\).cfg/\1/' )\"" > $@
	 echo "AdminDarcID = \"$$( grep AdminDarc $(VARIABLES) | sed -e 's/.* //' )\"" >> $@
	 echo "Ephemeral = \"$$( grep Private $(VARIABLES) | sed -e 's/.* //' )\"" >> $@
	 echo >> $@
	 cat $(lastword $^) >> $@

docker:
	@echo Building new conode
	docker build -t $(IMAGE_NAME):$(TAG) -f build/Dockerfile build
	docker tag $(IMAGE_NAME):$(TAG) $(IMAGE_NAME):dev

docker_start: docker_stop $(VARIABLES)
	docker run -ti --rm -p 7770-7777:7770-7777 --name $(CONTAINER) $(IMAGE_NAME):dev

docker_start_detached: docker_stop $(VARIABLES)
	docker run -d --rm -p 7770-7777:7770-7777 --name $(CONTAINER) $(IMAGE_NAME):dev

docker_wait:
	@for port in $$( seq 7771 2 7777 ); do \
	  echo "Waiting for localhost:$$port"; \
	  until curl -s http://localhost:$$port/ok > /dev/null; do sleep .2; done; \
	done

docker_stop:
	docker rm -f $(CONTAINER) || echo "No running docker"

docker_clean: docker_stop
	docker image ls $(IMAGE_NAME) -q | xargs docker rmi -f || echo done

clean: docker_clean
	rm -rf build/conodes/*{db,cfg} $(VARIABLES) $(WEBAPP_ASSET)
	rm -f $(VARIABLES)
