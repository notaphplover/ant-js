[![Build status](https://travis-ci.org/notaphplover/ant-js.svg?branch=develop)](https://travis-ci.org/notaphplover/ant-js.svg?branch=develop)
[![Coverage Status](https://coveralls.io/repos/github/notaphplover/ant-js/badge.svg?branch=develop)](https://coveralls.io/github/notaphplover/ant-js?branch=develop)
[![npm version](https://badge.fury.io/js/%40antjs%2Fant-js.svg)](https://badge.fury.io/js/%40antjs%2Fant-js.svg)

## Description

Scalable query manager for redis. This library receives a set of models and queries and manages the access to redis and database servers.

## Status

In alpha phase. We expect to start adding docs at May of 2019.

## How to install the library

You can donwnload the library direclty, clone it or install it as a npm dependency:

```
npm i @antjs/ant-js
```

## How to build the library

Just run the build script:

```
npm run build
```

## How to run tests

Tests are dockerized in order to start a redis server in a virtual environment.

You can run all the tests with the test script:

```
npm test
```

A coverage report will be generated at the coverage directory.

## Aknowledgements

Special thanks to [Pablo López Torres](https://github.com/supertowers) for the theoretical knowledge and conversations that led to this project.