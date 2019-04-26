FROM debian:stretch-slim
WORKDIR /root/
COPY conodes /root/conodes
RUN apt update; apt install -y procps; apt clean
COPY run_nodes.sh .
COPY conode /root/conode

EXPOSE 7770 7771 7772 7773 7774 7775 7776 7777

CMD COTHORITY_ALLOW_INSECURE_ADMIN=true ./run_nodes.sh -n 4 -v 2 -c -d /root/conodes
