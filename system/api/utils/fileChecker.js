const sharp = require('sharp');
const { fileTypeFromBuffer } = require('file-type');
const { FILES_CONSTANTS, VALID_FILES_FORMATS } = require('../constants');
const { MAX_IMAGE_SIZE, MAX_IMAGE_PIXELS, MIN_IMAGE_DIMENSIONS, MAX_IMAGE_DIMENSIONS } = FILES_CONSTANTS;

const ConvertImageToWebP = async (fileBuffer) => {
    if (fileBuffer.length > MAX_IMAGE_SIZE) {
        throw new Error("La imagen supera el tamaño máximo permitido de 5 MB.");
    }

    const type = await fileTypeFromBuffer(fileBuffer);

    if (!type) { throw new Error("Archivo inválido"); }

    if (!VALID_FILES_FORMATS.images.includes(type.mime)) {
        throw new Error("Formato de imagen no permitido. Usa JPEG, JPG, PNG o WEBP.");
    }

    const metadata = await sharp(fileBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
        throw new Error("No se pudieron obtener las dimensiones de la imagen.");
    }

    if (width * height > MAX_IMAGE_PIXELS) {
        throw new Error("La imagen es demasiado grande.");
    }

    if (width < MIN_IMAGE_DIMENSIONS || height < MIN_IMAGE_DIMENSIONS) {
        throw new Error(`La imagen debe tener al menos ${MIN_IMAGE_DIMENSIONS}x${MIN_IMAGE_DIMENSIONS} píxeles.`);
    }

    let image = sharp(fileBuffer).rotate();

    if (width > MAX_IMAGE_DIMENSIONS || height > MAX_IMAGE_DIMENSIONS) {
        image = image.resize({
            width: MAX_IMAGE_DIMENSIONS,
            height: MAX_IMAGE_DIMENSIONS,
            fit: "inside",
            withoutEnlargement: true
        });
    }

    return await image.webp({ quality: 75 }).toBuffer();
};

async function ResizeImage(webpBuffer, width, height) {
    return await sharp(webpBuffer)
        .resize(width, height, {
            fit: "cover",
            position: "centre"
        })
        .toBuffer();
}

module.exports = {
    ConvertImageToWebP,
    ResizeImage
}
