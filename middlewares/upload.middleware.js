const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../utils/ApiError");

const uploadsRoot = path.join(__dirname, "..", "uploads");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subFolder = "misc";
    if (file.fieldname.includes("image")) subFolder = "images";
    else if (file.fieldname.includes("video")) subFolder = "videos";
    else if (file.fieldname.includes("attachment") || file.fieldname.includes("document")) subFolder = "documents";

    const fullPath = path.join(uploadsRoot, subFolder);
    fs.mkdirSync(fullPath, { recursive: true }); 
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype.startsWith("video") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/octet-stream"
  )
    cb(null, true);
  else cb(new ApiError("Invalid file type, please upload an image, video or PDF", 400), false);
};

const filesConfiguration = multer({
  storage: multerStorage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const uploadAnyFile = filesConfiguration.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "attachments", maxCount: 5 },
]);

module.exports = uploadAnyFile;