const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;
const asyncHandler = require("express-async-handler");

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(Math.round(metadata.format.duration));
    });
  });
};

const buildFileUrl = (req, file) => {
  const relativePath = path.relative(path.join(__dirname, "..", "uploads"), file.path);
  const urlPath = relativePath.split(path.sep).join("/");
  return `/uploads/${urlPath}`; 
};

class LocalStorageController {
  uploadSingleImage = (fieldName) =>
    asyncHandler(async (req, res, next) => {
      const file = req.file || req.files?.[fieldName]?.[0];
      if (!file) return next();
      req.body[fieldName] = buildFileUrl(req, file);
      next();
    });

  uploadMultipleImages = (fieldName) =>
    asyncHandler(async (req, res, next) => {
      const files = Array.isArray(req.files) ? req.files : req.files?.[fieldName];
      if (!files || files.length === 0) return next();
      req.body[fieldName] = files.map((file) => buildFileUrl(req, file));
      next();
    });

  uploadDocument = (fieldName) =>
    asyncHandler(async (req, res, next) => {
      const file = req.file || req.files?.[fieldName]?.[0];
      if (!file) return next();
      req.body[fieldName] = buildFileUrl(req, file);
      next();
    });

  uploadMultipleDocuments = (fieldName) =>
    asyncHandler(async (req, res, next) => {
      const files = Array.isArray(req.files) ? req.files : req.files?.[fieldName];
      if (!files || files.length === 0) return next();
      req.body[fieldName] = files.map((file) => buildFileUrl(req, file));
      next();
    });

  uploadSingleVideo = (fieldName) =>
    asyncHandler(async (req, res, next) => {
      const file = req.file || req.files?.[fieldName]?.[0];
      if (!file) return next();

      const url = buildFileUrl(req, file);
      const duration = await getVideoDuration(file.path);

      req.body[fieldName] = url;
      req.body.duration = duration;
      next();
    });

  uploadMultipleVideos = (fieldName) =>
    asyncHandler(async (req, res, next) => {
      const files = Array.isArray(req.files) ? req.files : req.files?.[fieldName];
      if (!files || files.length === 0) return next();

      const results = await Promise.all(
        files.map(async (file) => {
          const url = buildFileUrl(req, file);
          const duration = await getVideoDuration(file.path);
          return { url, duration };
        })
      );

      req.body[fieldName] = results.map((r) => r.url);
      req.body.duration = results.reduce((sum, r) => sum + r.duration, 0);
      next();
    });

  deleteFileByUrl = async (fileUrl) => {
    try {
      const uploadsIndex = fileUrl.indexOf("/uploads/");
      
      if (uploadsIndex === -1) return false;
      const relativePath = fileUrl.substring(uploadsIndex + "/uploads/".length);
      const fullPath = path.join(__dirname, "..", "uploads", relativePath);
      fs.unlinkSync(fullPath);
      return true;
    } catch (error) {
      console.log("🚀 ~ deleteFileByUrl ~ error:", error);
      return false;
    }
  };

  deleteOldImage = async (url) => await this.deleteFileByUrl(url);
  deleteOldDocument = async (url) => await this.deleteFileByUrl(url);
  deleteOldVideo = async (url) => await this.deleteFileByUrl(url);
}

module.exports = new LocalStorageController();