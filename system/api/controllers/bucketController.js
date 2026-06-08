const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/minio');
const { v4: uuidv4 } = require('uuid');

const getFileUrl = async (filePath, expirationTime = 300) => {
    const command = new GetObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: filePath
    });

    // Genera la URL pre-firmada
    return await getSignedUrl(s3, command, { expiresIn: expirationTime });
};

const uploadFile = async(file, mimeType, extension, folder) => {
    // Generamos un nombre único
    const uniqueName = `${folder}/${uuidv4()}.${extension}`;

    // Subimos archivo a bucket
    const command = new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: uniqueName,
        Body: file,
        ContentType: mimeType,
        ContentLength: file.length
    });
    await s3.send(command);

    return uniqueName
};

const deleteFile = async(filePath) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: filePath
    });

    await s3.send(command);
};

module.exports = {
    getFileUrl,
    uploadFile,
    deleteFile
};
