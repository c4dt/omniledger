from flask import Flask
from flask import request

import requests

app = Flask(__name__)

hosttorequest = 'localhost:4200'


@app.route('/')
@app.route('/api/<path:other>')
@app.route('/c4dt/<path:other>')
@app.route('/admin/<path:other>')
@app.route('/register')
def root(other = ""):
    r = requests.get('http://' + hosttorequest + '/')
    return r.content


@app.route('/<path:other>')
def other(other):
    path = 'http://' + hosttorequest + '/' + other
    print(path, request.data)
    if request.method == 'POST':
        r = requests.post(path, request.data)
    else:
        r = requests.get(path)
    return r.content


@app.route('/api/v0/cas/proxyValidate')
def proxyVerify():
    ticket = request.args.get('ticket')
    return """
  <cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
    <cas:authenticationSuccess>
      <cas:user>{ticket}</cas:user>
      <cas:proxyGrantingTicket>{ticket}</cas:proxyGrantingTicket>
      <cas:proxies>
        <cas:proxy>https://proxy2/pgtUrl</cas:proxy>
        <cas:proxy>https://proxy1/pgtUrl</cas:proxy>
      </cas:proxies>
    </cas:authenticationSuccess>
  </cas:serviceResponse>""".format(ticket=ticket)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4201)
