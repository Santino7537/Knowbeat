const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const TEMP_FFMPEG = path.join(ROOT, "temp", "ffmpeg")

module.exports = {
    ROOT,
    TEMP_FFMPEG
};