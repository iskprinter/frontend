FROM node:20-alpine3.18 AS install
WORKDIR /app
COPY ./package.json ./package-lock.json ./
RUN apk add --no-cache --update \
  build-base \
  make \
  python3
# Remove UV_USE_IO_URING=0 as soon as possible
# https://github.com/nodejs/node/issues/48444
RUN UV_USE_IO_URING=0 npm ci
COPY . ./

FROM install AS test
RUN apk update && apk add chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
RUN npm test

FROM test AS build
RUN npm run build -- --configuration=production

FROM openresty/openresty:1.21.4.1-alpine AS package
COPY --from=build /app/dist/* /usr/share/nginx/html/
COPY ./nginx/. /
RUN while read env_var; do echo "env ${env_var};" >> /usr/local/openresty/nginx/conf/nginx.conf; done < /whitelisted-environment-variables
