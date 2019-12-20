#!/bin/bash
if [ $GITHUB_REF == /refs/heads/* ]; then
  echo "\nGITHUB_BRANCH=${GITHUB_REF:12}\n" >> .env
  echo '$GITHUB_BRANCH added to .env file'
else
  echo '$GITHUB_REF is not a valid ref!!!'
  exit 1
fi

docker-compose -f docker-compose.test.ci.yml up --abort-on-container-exit --exit-code-from ant_lib
