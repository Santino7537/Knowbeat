FROM node:22-alpine

WORKDIR /app

COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev

COPY worker ./worker
COPY api/utils/dvhHelpers.js ./api/utils/dvhHelpers.js

CMD ["node", "worker/index.js"]
