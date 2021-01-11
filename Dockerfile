FROM node:14.9.0-alpine3.12 AS install
WORKDIR /app
COPY ./package.json ./package-lock.json ./
RUN npm ci

FROM install AS build
COPY . ./
RUN npm run build -- --configuration=production

FROM build AS test
RUN apk update && apk add chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
RUN npm test

FROM openresty/openresty:1.19.3.1-0-alpine AS package
COPY --from=build /app/dist/* /usr/share/nginx/html/
COPY ./nginx/. /
RUN while read env_var; do echo "env ${env_var};" >> /usr/local/openresty/nginx/conf/nginx.conf; done < /whitelisted-environment-variables
