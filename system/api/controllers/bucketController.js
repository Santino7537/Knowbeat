const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
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

const createEmptyFolder = async(bucket, route) => {
    // Creamos carpeta vacía en el bucket
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: route
    });

    await s3.send(command);
};

const deleteFile = async(bucket, filePath) => {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: filePath
    });

    await s3.send(command);
};

const deleteFolder = async (bucket, route) => {
    const objects = await s3.send(
        new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: route
        })
    );

    if (!objects.Contents?.length) { return; }

    await s3.send(
        new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: 
                objects.Contents.map(obj => ({ Key: obj.Key })) }
        })
    );
};

module.exports = {
    getPrivateFileUrl,
    getPublicFileUrl,
    uploadFile,
    createEmptyFolder,
    deleteFile,
    deleteFolder
};
