const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3_client');
const { v4: uuidv4 } = require('uuid');

const getPrivateFileUrl = async (bucket, filePath, expirationTime = 300) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filePath
    });

    // Genera la URL pre-firmada
    return await getSignedUrl(s3, command, { expiresIn: expirationTime });
};

function getPublicFileUrl(bucket, filePath) {
  return `${process.env.MINIO_PUBLIC_URL}/${bucket}/${filePath}`;
}

const uploadFile = async(bucket, file, mimeType, extension) => {
    // Generamos un nombre único
    const uniqueName = `${uuidv4()}.${extension}`;

    // Subimos archivo a bucket
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: uniqueName,
        Body: file,
        ContentType: mimeType,
        ContentLength: file.length
    });
    await s3.send(command);

    return uniqueName
};

const deleteFile = async(bucket, filePath) => {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: filePath
    });

    await s3.send(command);
};

module.exports = {
    getPrivateFileUrl,
    getPublicFileUrl,
    uploadFile,
    deleteFile
};
