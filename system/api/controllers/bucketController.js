const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3_client');

const getPrivateFileUrl = async (bucket, filePath, expirationTime = 300, options = {}) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filePath,
        ...(options.contentType ? { ResponseContentType: options.contentType } : {}),
        ...(options.filename ? {
            ResponseContentDisposition: `${options.download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(options.filename)}`
        } : {})
    });

    return await getSignedUrl(s3, command, { expiresIn: expirationTime });
};

function getPublicFileUrl(bucket, filePath) {
  return `${process.env.MINIO_PUBLIC_URL}/${bucket}/${filePath}`;
}

const uploadFile = async(bucket, file, fileName, mimeType, filePath = null) => {
    // Subimos archivo a bucket
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filePath ? `${filePath}/${fileName}` : fileName,
        Body: file,
        ContentType: mimeType,
        ContentLength: file.length
    });
    await s3.send(command);

    return fileName
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

const deleteFolderAndFiles = async (bucket, route) => {
    let continuationToken;
    do {
        const page = await s3.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: route,
            ContinuationToken: continuationToken
        }));
        const keys = (page.Contents || []).map(({ Key }) => ({ Key }));
        for (let offset = 0; offset < keys.length; offset += 1000) {
            const result = await s3.send(new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: keys.slice(offset, offset + 1000), Quiet: false }
            }));
            if (result.Errors?.length) {
                throw new Error(`MinIO no pudo eliminar ${result.Errors.length} objeto(s).`);
            }
        }
        continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
};

module.exports = {
    getPrivateFileUrl,
    getPublicFileUrl,
    uploadFile,
    createEmptyFolder,
    deleteFile,
    deleteFolderAndFiles
};
