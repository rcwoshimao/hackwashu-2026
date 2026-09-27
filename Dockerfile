FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN cd demo/orbit-app && bun install
RUN bun run build:web

FROM oven/bun:1.4.2
WORKDIR /app
COPY --from=build /app /app
COPY --from=node:24 /usr/local/bin/node /usr/local/bin/node
COPY --from=node:24 /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
RUN mkdir -p /app/data && chown -R bun:bun /app/data
USER bun
EXPOSE 8787
CMD ["bun", "run", "apps/api/src/main.ts"]
