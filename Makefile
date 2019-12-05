swap:
	#@if egrep -q "COT.*${to}" dynacred/Makefile; then \
	#    echo "Already pointing to ${to}/cothority"; exit 1; \
	# fi
	@for d in conode dynacred webapp; do \
	  cd $$d; \
	  for p in cothority kyber; do \
		perl -pi -e "s:${from}/$$p:${to}/$$p:" Makefile $$( find app spec src -name "*.ts" ); \
		npm remove @${from}/$$p; \
		npm i --save @${to}/$$p; \
	  done; \
	  npm run lint:fix; \
	  cd ..; \
	done

cothority_dedis: from := c4dt
cothority_dedis: to := dedis
cothority_dedis: swap

cothority_c4dt: from := dedis
cothority_c4dt: to := c4dt
cothority_c4dt: swap
