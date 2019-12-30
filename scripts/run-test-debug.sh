#!/bin/bash

docker-compose -f docker-compose.yml -f docker-compose.test.debug.yml up --abort-on-container-exit --exit-code-from ant_lib
