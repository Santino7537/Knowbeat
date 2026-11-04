FROM minio/mc:RELEASE.2025-08-13T08-35-41Z AS minio-client

FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gzip tar default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-100.12.2.tgz \
    -o /tmp/mongodb-tools.tgz \
    && tar -xzf /tmp/mongodb-tools.tgz \
        --strip-components=2 \
        -C /usr/local/bin \
        mongodb-database-tools-debian12-x86_64-100.12.2/bin/mongodump \
        mongodb-database-tools-debian12-x86_64-100.12.2/bin/mongorestore \
    && rm /tmp/mongodb-tools.tgz

COPY --from=minio-client /usr/bin/mc /usr/local/bin/mc

WORKDIR /app

COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev

COPY backup/index.js backup/schedule.js ./backup/

ENTRYPOINT ["node", "backup/index.js"]
