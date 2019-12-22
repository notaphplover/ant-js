#!/bin/bash

if [ -z "$GITHUB_REF" ]; then
  echo '$GITHUB_REF is not provided!'
  exit 1
fi

beginswith() { case $2 in "$1"*) true;; *) false;; esac; }

PREFIX="refs/heads/"

if beginswith $PREFIX "$GITHUB_REF"; then
  echo "\nGITHUB_BRANCH=${GITHUB_REF#$PREFIX}\n" >> .env
  echo "Found something that matches with a branch ref"
else
  echo "\nGITHUB_BRANCH=$GITHUB_REF\n" >> .env
  echo "Found something that does not match with a branch ref"
fi
echo '$GITHUB_BRANCH added to .env file'

docker-compose -f docker-compose.yml -f docker-compose.test.ci.yml up --abort-on-container-exit --exit-code-from ant_lib
