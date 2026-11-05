const sharp = require('sharp');
const fs = require('fs/promises');
const path = require('path');
const { promisify } = require('util');
const { execFile } = require('child_process');
const { fileTypeFromBuffer } = require('file-type');
const { FILES_CONSTANTS, VALID_FILES_FORMATS } = require('../constants');
const { MAX_IMAGE_SIZE, MAX_IMAGE_PIXELS, MIN_IMAGE_DIMENSIONS, MAX_IMAGE_DIMENSIONS } = FILES_CONSTANTS;

const execFileAsync = promisify(execFile);

const detectRealType = async (buffer) => {
    const type = await fileTypeFromBuffer(buffer);

    return {
        mime: type?.mime || null,
        ext: type?.ext || null,
        valid: !!type
    };
}

const analyzeMedia = async (filePath) => {
    const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-print_format', 'json',
        '-show_streams',
        '-show_format',
        filePath
    ]);
    return JSON.parse(stdout);
}

const validateMedia = async (filePath) => {
    try {
        const data = await analyzeMedia(filePath);

        if (!data?.streams || data.streams.length === 0) {
            return { valid: false };
        }

        return { valid: true };
    } catch (e) { return { valid: false, error: e.message }; }
}

const TEXT_EXTENSIONS = new Set(['.txt']);
const MIME_EXTENSIONS = {
    'image/jpeg': new Set(['.jpg', '.jpeg']),
    'image/jpg': new Set(['.jpg', '.jpeg']),
    'image/png': new Set(['.png']),
    'image/webp': new Set(['.webp']),
    'application/pdf': new Set(['.pdf']),
    'audio/mpeg': new Set(['.mp3']),
    'audio/wav': new Set(['.wav']),
    'audio/x-wav': new Set(['.wav']),
    'audio/ogg': new Set(['.ogg']),
    'video/mp4': new Set(['.mp4']),
    'video/webm': new Set(['.webm'])
};

const validateFile = async (filePath, originalName) => {
    const buffer = await fs.readFile(filePath);
    const type = await detectRealType(buffer);
    const extension = path.extname(originalName || '').toLowerCase();

    if (!type.valid) {
        if (!TEXT_EXTENSIONS.has(extension) || buffer.length > 1024 * 1024 || buffer.includes(0)) {
            throw new Error("Invalid file");
        }

        try {
            new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        } catch {
            throw new Error("Invalid text file");
        }
        return { mime: 'text/plain', ext: 'txt', valid: true };
    }

    if (!MIME_EXTENSIONS[type.mime]?.has(extension)) {
        throw new Error("La extensión no coincide con el contenido del archivo.");
    }

    // IMAGES
    if (VALID_FILES_FORMATS.images.includes(type.mime)) {
        return type;
    }

    // MEDIA
    if (VALID_FILES_FORMATS.videos.includes(type.mime) ||
        VALID_FILES_FORMATS.audios.includes(type.mime)) {
        
        const validation = await validateMedia(filePath);
        if (!validation.valid) { throw new Error("Corrupt media"); }

        return type;
    }

    // PDF y TXT
    if (VALID_FILES_FORMATS.texts.includes(type.mime)) {
        // TXT
        if (type.mime === "text/plain") { return type; }
        // PDF
        if (!buffer.toString("utf8", 0, 4).startsWith("%PDF")) {
            throw new Error("Corrupt PDF");
        }

        return type;
    }

    throw new Error("Unsupported file");
}

const convertImageToWebP = async (fileBuffer) => {
    if (fileBuffer.length > MAX_IMAGE_SIZE) {
        throw new Error("La imagen supera el tamaño máximo permitido de 5 MB.");
    }

    const type = await detectRealType(fileBuffer);

    if (!type.valid) { throw new Error("Archivo inválido"); }

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

async function resizeImage(webpBuffer, width, height) {
    return await sharp(webpBuffer)
        .resize(width, height, {
            fit: "cover",
            position: "centre"
        })
        .toBuffer();
}

module.exports = {
    convertImageToWebP,
    resizeImage,
    validateFile
}
