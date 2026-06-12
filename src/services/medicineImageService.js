const fs = require("fs");
const path = require("path");

const MEDICINE_IMAGE_DIRECTORY = path.join(__dirname, "..", "public", "images", "medicines");
const MEDICINE_UPLOAD_DIRECTORY = path.join(MEDICINE_IMAGE_DIRECTORY, "uploads");
const SUPPORTED_IMAGE_EXTENSION = /\.(gif|jpe?g|png|svg|webp)$/i;

function ensureUploadDirectory() {
  if (!fs.existsSync(MEDICINE_UPLOAD_DIRECTORY)) {
    fs.mkdirSync(MEDICINE_UPLOAD_DIRECTORY, { recursive: true });
  }
}

function encodedUrlForPath(filePath) {
  const relativePath = path.relative(MEDICINE_IMAGE_DIRECTORY, filePath);
  const encodedPath = relativePath
    .split(path.sep)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `/images/medicines/${encodedPath}`;
}

function collectMedicineImages(directory = MEDICINE_IMAGE_DIRECTORY) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectMedicineImages(entryPath);
    }

    if (!entry.isFile() || !SUPPORTED_IMAGE_EXTENSION.test(entry.name)) {
      return [];
    }

    return [{
      label: path.relative(MEDICINE_IMAGE_DIRECTORY, entryPath),
      url: encodedUrlForPath(entryPath)
    }];
  });
}

function getMedicineImageChoices() {
  return collectMedicineImages()
    .sort((left, right) => left.label.localeCompare(right.label));
}

function isAvailableMedicineImage(imageUrl) {
  return getMedicineImageChoices().some((choice) => choice.url === imageUrl);
}

function publicUrlForUploadedFile(file) {
  if (!file || !file.path) {
    return null;
  }

  return encodedUrlForPath(file.path);
}

module.exports = {
  MEDICINE_UPLOAD_DIRECTORY,
  SUPPORTED_IMAGE_EXTENSION,
  ensureUploadDirectory,
  getMedicineImageChoices,
  isAvailableMedicineImage,
  publicUrlForUploadedFile
};
