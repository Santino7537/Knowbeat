require('dotenv').config();
const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: "sa-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true // importante para MinIO local
});

module.exports = s3;