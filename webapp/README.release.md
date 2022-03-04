# Omniledger webapp

This is the webapp to use for OmniLedger.
There is a default `config.toml` in the `www/assets` directory that must be renamed:

```bash
mv www/assets/config_dedis.toml www/assets/config.toml
```

Then you must serve the `www/`-directory as root-directory with apache, nginx, or your preferred web-server.

The code for this webapp can be found here:

https://github.com/c4dt/omniledger/tree/main/webapp
