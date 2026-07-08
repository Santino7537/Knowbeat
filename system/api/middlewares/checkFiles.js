const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { MAX_FILE_SIZE } = require('../constants');
const { TEMP_FFMPEG } = require("../config/paths");

const storage = multer.diskStorage({ destination: TEMP_FFMPEG });

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
});

const checkFilesUpload = (fieldName, maxCount = 1) => {
  const middleware = upload.array(fieldName, maxCount);

  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            return res.status(400).json({ error: "Archivo demasiado grande" });

          case "LIMIT_UNEXPECTED_FILE":
            if (err.field !== fieldName) {
              return res.status(400).json({
                error: `Campo de archivo inválido. Se esperaba '${fieldName}'`
              });
            }

            return res.status(400).json({ error: `Máximo de ${maxCount} archivo/s` });

          default:
            return res.status(400).json({ error: err.message });
        }
      }

      if (err) { return res.status(500).json({ error: "Error procesando archivos" }); }

      next();
    });
  };
};

module.exports = { checkFilesUpload };