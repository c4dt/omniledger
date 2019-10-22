swap:
	@if egrep -q "COT.*${to}" dynacred/Makefile; then \
	    echo "Already pointing to ${to}/cothority"; exit 1; \
	 fi
	@for d in conode dynacred webapp; do \
	  cd $$d; \
	  perl -pi -e "s:${from}/cothority:${to}/cothority:" Makefile $$( find app spec src -name "*.ts" ); \
	  npm remove @${from}/cothority; \
	  npm i --save @${to}/cothority; \
	  npm run lint:fix; \
	  cd ..; \
	done

cothority_dedis: from := c4dt
cothority_dedis: to := dedis
cothority_dedis: swap

cothority_c4dt: from := dedis
cothority_c4dt: to := c4dt
cothority_c4dt: swap
