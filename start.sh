#!/usr/bin/env bash

set -euxo pipefail

docker build . -t frontend
container_id="$(
    docker run \
        -d \
        -e "BACKEND_URL=${BACKEND_URL}" \
        -e "CLIENT_ID=${CLIENT_ID}" \
        -v "${PWD}/dist:/usr/share/nginx/html" \
        -p 4200:80 \
        frontend
)"

function cleanup()
{
    echo "Stopping and removing container ${container_id}..."
    docker stop "$container_id"
    docker rm "$container_id"
}
trap cleanup EXIT

node_modules/.bin/ng build --watch
