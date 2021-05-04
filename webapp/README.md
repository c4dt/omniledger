# OmniLedger

This project has several sources:
- ByzCoin from DEDIS: https://github.com/dedis/cothority
- Dynamic Consent idea, from https://personhood.online
- Simple identity management, for https://c4dt.org

The goal is to have a framework that has an easy-to use UI frontend for the ByzCoin project
and that can run on the DEDIS blockchain available at https://conode.c4dt.org.

## Cothority-typescript libraries

Currently the cothority typescript libraries are stored under the @c4dt-handle, until the
changes can be integrated in the official version @dedis. The current development of C4DT
on this library is here:

https://github.com/c4dt/cothority-ts

## Running it using DEDIS' test network
Instead of running the conodes yourself, you can instead use the test network of DEDIS using:
 
```bash
make serve
```
You won't need to run this command after changes to the webapp, it should refresh automatically (usual caveats still apply for instance with css caching)


## Running it locally

To run this locally, you need to run 4 conodes on your local machine, and then interact with
those four conodes.

First you need to create the docker image, which will download the necessary cothority branch
and then build the docker. This has been chosen over publishing the docker image directly, because
at this stage of development, you most probably will want to / have to work with the cothority
code:

```bash
mv src/assets/config.toml src/assets/backup_config.toml
mv src/assets/config.local.toml src/assets/config.toml 
cd ../cothority
make docker
```

Every time you change the cothority-source, you will have to re-run ```make docker```.

Now you can start the docker:

```bash
make -C conode docker_run
```

And then run the code locally:

```bash
cd ../webapp
npm ci
ng serve --open
```

## Contact

You can contact us through linus.gasser@epfl.ch for questions.

# Running it

## Development server

Use `make -C conode docker` to make the Docker image.

Use `make -C conode docker_run` to run the Docker image, which will already have some config necessary to make the following
work.

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/main/README.md).

# Versions

- 0.7.0 - 210428 - Moving to Angular 10
- 0.6.0 - 190520 - Added devices: now you can distribute your identity over multiple
devices
