COT := dedis

help:
	@echo "run with cothority_dedis or cothority_c4dt"

swap:
	@if [ ${COT} = ${to} ]; then \
		echo "Already pointing to ${to}/cothority"; exit 1; \
	 fi
	@for d in dynacred webapp mobile; do \
	  cd $$d && \
	  for p in cothority kyber; do \
		perl -pi -e "s:${from}/$$p:${to}/$$p:" Makefile $$( find app spec src -name "*.ts" ) && \
		npm remove @${from}/$$p && \
		npm i --save @${to}/$$p; \
	  done && \
	  npm audit fix && \
	  npm run lint:fix; \
	  cd ..; \
	done && \
	perl -pi -e "s/^COT := .*/COT := ${to}/" ./Makefile

cothority:
	git clone https://github.com/${COT}/cothority --depth 1

cothority-pull: cothority
	cd cothority && git pull

cothority_dedis: from := c4dt
cothority_dedis: to := dedis
cothority_dedis: swap

cothority_c4dt: from := dedis
cothority_c4dt: to := c4dt
cothority_c4dt: swap
