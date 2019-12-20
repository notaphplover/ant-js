#!/bin/bash
if [ -z "$COVERALLS_REPO_TOKEN" ]; then
    echo '$COVERALLS_REPO_TOKEN is not provided.'
else
    echo "\nCOVERALLS_REPO_TOKEN=$COVERALLS_REPO_TOKEN\n" >> .env
    echo '$COVERALLS_REPO_TOKEN added to .env file'
fi

docker-compose -f docker-compose.test.ci.yml up --abort-on-container-exit --exit-code-from ant_lib
