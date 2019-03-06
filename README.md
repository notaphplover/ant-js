[![Build status](https://travis-ci.org/notaphplover/ant-js.svg?branch=develop)](https://travis-ci.org/notaphplover/ant-js.svg?branch=develop)
[![Coverage Status](https://coveralls.io/repos/github/notaphplover/ant-js/badge.svg?branch=develop)](https://coveralls.io/github/notaphplover/ant-js?branch=develop)

## Description

Scalable query manager for redis. This library receives a set of models and queries and manages the access to redis and database servers.

## Status

Not even in alpha, so please don´t use it for now.

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