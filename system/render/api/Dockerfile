FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app/system/api

COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev

COPY api/ ./
COPY client/exercises_content/ /app/system/client/exercises_content/
RUN mkdir -p /app/system/temp/ffmpeg

CMD ["node", "index.js"]
