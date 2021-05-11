FROM c4dt/byzcoin:latest
WORKDIR /root/
COPY conodes ./conodes
COPY run_nodes.sh ./

EXPOSE 7770 7771 7772 7773 7774 7775 7776 7777

CMD COTHORITY_ALLOW_INSECURE_ADMIN=true ./run_nodes.sh -n 4 -v 2 -c -d /root/conodes
