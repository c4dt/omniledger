# CAS - Central Authentication Service

CAS is described here
 - overview: https://en.wikipedia.org/wiki/Central_Authentication_Service.
 - specs: https://apereo.github.io/cas/6.0.x/protocol/CAS-Protocol-Specification.html

It is used for OmniLedger authentication with common tools.

A small subset of CAS is implemented in `cmd/cas`. Currently only the following endpoints are implemented, and are not feature full.

CAS 3.0
  - `api/v0/cas/login` - to start the login procedure and return a ticket
    - as the user keys are inside the StorageDB of the browser, it's currently provided directly by the webapp
  - `api/v0/cas/p3/serviceValidate` - to validate and return the username of the ticket
  - `api/v0/cas/logout` - to logout

CAS 2.0 (Matrix needs that)
- `api/v0/cas/proxyValidate` - to validate and return the username of the ticket

To better understand the interactions of the system, one can look at the [messages' UML](login.png).

To test integration, we also provide `cmd/cas-test`, a small user story simulator. In this case, it simulates the user login into either WordPress or Matrix using CAS. It needs a user data extracted from the browser' IndexedDB (the value of `IndexedDB.dynasent.contacts`). For example, one could use it as

`
cas-test --user-data-path path/to/extracted/user/data matrix https://matrix.c4dt.org
cas-test --user-data-path path/to/extracted/user/data wordpress https://c4dt.org
`

It will take the given service and simulate a login fot the given user.

To extract the user data from the browser, one could use something like
```javascript
function tr(e) {
	if (e instanceof Uint8Array) return [...e.values()]
	else if (e instanceof Object) return Object.fromEntries(Object.entries(e).map(([k,v]) => [k, tr(v)]))
	else return e
}
window.indexedDB.open("dynasent2", 10).onsuccess = (event) => {
	const store = event.target.result
		.transaction(["contacts"])
		.objectStore("contacts")
	store.get("main:credID").onsuccess = (cred_event) =>
	store.get("main:private").onsuccess = (priv_event) =>
		console.log(JSON.stringify([
			tr(cred_event.target.result),
			tr(priv_event.target.result),
		]))
}
```

# Configuration for `cas`

A few elements are needed to start `cas`. Here goes an example to fill in
```toml
ByzCoinID = "hex encoded instance ID" # same as the webapp's asset

CoinCost = 1 # number of coin to transfer back and forth
ChallengeSize = 20  # size of challenge to generate
ChallengeHash = "sha256"  # how it the challenge hashed
TicketEncoding = "base64url"  # how is the ticket's payload is encoded
TxArgumentName = "challenge"  # field name to find in transaction
TxValidityDuration = "5m"  # maximum validity time of ticket

# mapping from the service's hostname to the CoinInstance ID of the Action
[ServiceToCoinInstanceIDs]
localhost = "8c22411f1aaf3248542f6b677fd066db3178bc0a2b60adc2aaa9d6cc80938b0f"

# same as the webapp's asset
[[servers]]
Address = ""
Public = ""
Suite = ""
Url = ""
```

# Deployment

## Example for [matrix](https://matrix.org/)

### Local Tests

The local test is thought to be used like this:
- running synapse on localhost:7608 with `synctl start`
- running riot on localhost:8080 with `yarn start --watch`
- running omniledger-demo with `npm start`
- running omniledger with `make docker_run`
- running cas with `./cas config.toml`

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
