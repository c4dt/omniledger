# CAS - Central Authentication Service

CAS is described here: https://en.wikipedia.org/wiki/Central_Authentication_Service - it is used
in Matrix for a SSO authentication.

A very small subset of CAS is implemented here. Currently only the following two endpoints are implemented,
and even those two not fully:

- `api/v0/cas/login` - to start the login procedure and return a ticket
- `api/v0/cas/proxyValidate` - to return the username of the ticket

But it is enough to make Matrix happy and to let it login a user through the omniledger-demo.

## Messages

As per CAS, the following messages are exchanged:

1. Client to matrix: login request through `https://matrix.c4dt.org`
2. Matrix to client: redirect to `https://demo.c4dt.org/omniledger/api/v0/cas/login`
3. Client: check if account exists in browser, and display `yes` / `no` choice
4. Client to matrix: send ticket if login accepted
5. Matrix to `demo.c4dt.org/omniledger/api/v0/cas/proxyValidate`: get username of ticket
6. Matrix to Client: logged in, enjoy

### A couple of caveats

- matrix and riot are used mixed here. There are some message not shown that go between
the two
- the first redirection to `demo.c4dt.org` only loads the scripts, and runs the
login-verification in the user's browser
- the second redirection to `demo.c4dt.org` is an actual call to the server, and
cannot go through the user's browser, as it's directly done by the matrix-server
- the ticket is currently `ol-{credentialIID[0:8]}`, which is the same as the username
used 

### TODOs for CAS

- put `proxyValidate` and `serve_all.py` together - probably even as node.js, so that
the cothority-library can be used
- Actually store something in OmniLedger that can be verified in step 5. Then the ticket
would be the IID of the key stored in OmniLedger, and `proxyValidate` can fetch that
instance from OmniLedger and extract the credentialIID.
- Check if we need an access control system

### TODOs for OmniLedger-demo

Make this more user-friendly

## Configuration

### Local Tests

The local test is thought to be used like this:
- running synapse on localhost:7608 with `synctl start`
- running riot on localhost:8080 with `yarn start --watch`
- running omniledger-demo with `ng serve`
- running omniledger with `make docker_run`

Once these four points are running, the file `serve_all.py` can be used to set up the redirect to a local
`ng serve` as well as return a dummy CAS-authorization.

The following configuration can be used in `homeserver.yaml`:

```yaml
as_config:
   enabled: true
   server_url: "http://localhost:4201/api/v0/cas"
   service_url: "http://localhost:7608"
```

First you need to setup a new user by going to `http://localhost:4201/register`.

Then you can point your browser to `http://localhost:8080` and login to riot. 

### Apache

Using Apache, the following can be done to do the splitting of the api:

```apache
        ScriptAlias /omniledger/api/v0/cas/proxyValidate /home/omniledger/api/proxyValidate
        Alias /omniledger /home/omniledger/www
        <Directory /home/omniledger/api>
                Require all granted
        </Directory>

        <Directory /home/omniledger/www>
                RewriteEngine on

                # Don't rewrite files or directories
                RewriteCond %{REQUEST_FILENAME} -f [OR]
                RewriteCond %{REQUEST_FILENAME} -d
                RewriteRule ^ - [L]

                # Rewrite everything else to index.html
                # to allow html5 state links
                RewriteRule ^ index.html [L]

                Require all granted
        </Directory>
```

This sets up an `/omniledger` path in the current `VirtualHost` and points the `proxyValidate` to the
python-script. Don't forget to

```bash
a2enmod cgi alias rewrite
service apache2 restart
```

And put the `proxyValidate` file with `chmod 755` in the correct directory. The `flask` module must be
installed by root, as the cgi is run by root.
