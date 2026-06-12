const path = require("path");
const multer = require("multer");
const medicineImageService = require("../services/medicineImageService");

const allowedMimeTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp"
]);

const storage = multer.diskStorage({
  destination(req, file, callback) {
    medicineImageService.ensureUploadDirectory();
    callback(null, medicineImageService.MEDICINE_UPLOAD_DIRECTORY);
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "medicine";

    callback(null, `${Date.now()}-${baseName}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    const extensionIsAllowed = medicineImageService.SUPPORTED_IMAGE_EXTENSION.test(file.originalname);
    const mimeIsAllowed = allowedMimeTypes.has(file.mimetype);

    if (!extensionIsAllowed || !mimeIsAllowed) {
      return callback(new Error("Upload a medicine image file in PNG, JPG, WEBP, GIF, or SVG format."));
    }

    callback(null, true);
  }
});

function uploadMedicineImage(req, res, next) {
  upload.single("medicine_image_file")(req, res, (error) => {
    if (error) {
      req.uploadError = error.code === "LIMIT_FILE_SIZE"
        ? "Medicine image must be 3 MB or smaller."
        : error.message;
    }

    next();
  });
}

module.exports = {
  uploadMedicineImage
};
