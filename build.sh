#!/bin/sh -e
rm -rf dist/
mkdir -p dist/
cp index.mjs index.d.ts README.md LICENSE dist/
cp index.mjs dist/index.js.flow
babel index.mjs > dist/index.js
node -p "JSON.stringify({\
  ...require('./package'),\
  main: 'index',\
  module: 'index.mjs',\
  typings: 'index.d.ts',\
  scripts: undefined,\
  babel: undefined,\
  devDependencies: undefined\
}, null, 2)" > dist/package.json
