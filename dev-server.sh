#!/bin/bash

set -euo pipefail

stop_children() {
    echo 'Terminating children...'
    kill -TERM -$$ &>/dev/null || exit 0
}
trap stop_children EXIT

IMAGE_NAME='docker.io/iskprinter/frontend:local'
SERVED_PORT='8080'

docker build . -t "$IMAGE_NAME"
docker run  \
    --rm \
    -i \
    -e "BACKEND_URL=${BACKEND_URL}" \
    -p "${SERVED_PORT}:80" \
    -v "${PWD}/dist:/usr/share/nginx/html" \
    "$IMAGE_NAME" \
    &
npm run build -- \
    --watch \
    --configuration=production \
    &
echo "Now serving the frontend at http://localhost:${SERVED_PORT}"
wait
