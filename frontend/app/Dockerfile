
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

# The entrypoint renders /srv/config.json from the environment, which is how one
# image serves either edition. It replaces the base image's entrypoint, so the
# command below has to name `caddy` itself.
COPY docker-entrypoint.sh /usr/local/bin/docky-entrypoint.sh
RUN chmod +x /usr/local/bin/docky-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docky-entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
