# Mobile Personhood.Online App V3

This is the new personhood.online application that allows to test our latest ideas from https://personhood.online:

- wip: identity management
  - working: holds email, phone-# and website
  - working: create simple meetups to exchange contacts
  - wanted: adding passports to gather attributes 
  - wanted: allowing contacts to get updates of passports
- wip: personhood parties
  - working: get together to identify yourself as a person
  - working: sample app to create anonymous, troll-resistant polls
  - wanted: federate parties from different locations
  - wanted: re-enable troll-resistant chat from previous versions
- wip: integration with ByzCoin
  - working: creating and updating credentials
  - working: sending and receiving coins
  - working: sample app to play rock-paper-scissors
  - wanted: use personhood identity to add nodes to the byzcoin-network  
- wanted: login services using the identity management
- wanted: Peace on earth

You use this at your own risk. It stores all your data unprotected on our test-network that is open to the public internet, 
so be sure that you're OK with that!

It is written in NativeScript works and on iOS and Android.

## New V3 Version

The old personhood.online available on the Google-play store uses an internal test-network of the ByzCoin
blockchain. This new version is being ported to the V3 version of the ByzCoin blockchain, which is a more open, 
polished, and used version of the DEDIS blockchain.

## Bugs, comments

Comments, suggestions are welcome either in the issues, PRs or via mail: <mailto:linus.gasser@epfl.ch>

Please submit bugs and comments to the issue-tracker. Be sure to use the latest version of the software before
submitting bugs.

# Local Testing

As of 22nd of July, the app is not completely ported to the V3 version of ByzCoin. If you want to test it
locally and help debug it, here are the steps to do so.

## Environment

The tests suppose you have the following tools available:

- Node == 8.16.0
    - to check: `node -v`
    - to install on Mac: `brew install node@8`, then update your PATH so that `/usr/local/opt/node@8/bin` is at the front.

- Mac: XCode >= 10.2
    - command-line tools: `xcode-select --install`

- NativeScript == 5.1.x
    - to check: `tns --version`
    - to install: `npm i -g nativescript@5.1`
    
- Docker
    - to check - Mac: have the whale in your toolbar
    - to install: https://download.docker.com/mac/stable/Docker.dmg  

## Tests Overview

For the tests, you need to run your own 4-node Cothority on your computer. The mobile app will then
contact this Cothority.

When in test mode, your app will contact this Cothority on the address 192.168.100.1, on ports 7771, 7773,
7775, and 7777. You need to have an additional IP address on your default interface. For example, if your
default interface on a Mac is en0, you'll do:

```
sudo ifconfig en0 inet 192.168.100.1 add
```

To start your local Cothority, do the following:

```bash
make -C ../conode docker_run
```

This should give out a list of logging messages while it starts up 4 nodes locally on your computer.

You can test your conode and the extra IP address with curl:

```
curl http://192.168.100.1:7771/ok
```

To start the actual app:

```bash
make
tns run ios
# or
tns run android
```