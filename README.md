# OmniLedger demonstrator

Frontend for the dedis/omniledger blockchain with an accent on identity and consent-management. Current use-cases:
- login to https://matrix.c4dt.org
- login to restricted spaces https://www.c4dt.org/members-only/ and https://matrix.c4dt.org
- status of omniledger blockchain


## Running it locally

```bash
cd webapp
make
```
And connect to localhost:4200


## Development

While developing the webapp and dynacred, it is sometimes useful to have access to the
source of the cothority-libraries.
To do so, the `tsconfig.common.json` includes a possible replacement of these libraries
with the `cothority` directory in the root.
To start using the `cothority` libraries, and allow debugging changes to them, use:

```bash
make src
```

This will clone and/or upload the `dedis/cothority` repo and install the node-packages for
an easier debugging process.

To get back to the pre-compiled sources, use:

```bash
make npm
```

Please take care that this command will remove all changes you did to the `cothority` repository!
