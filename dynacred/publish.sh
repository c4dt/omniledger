#!/bin/sh -eu

readonly TAG=${1:-dev}

rm -rf dist

npm run build
npm run bundle
npm run doc

cp -r README.md package.json package-lock.json doc/ dist/

npm publish dist --tag "$TAG" --access public
