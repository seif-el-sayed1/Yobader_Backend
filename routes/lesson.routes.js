const express = require("express");

const LessonController = require("../controllers/lesson.controller");
const LessonValidator = require("../validators/lesson.validator");
const LocalStorageController = require("../controllers/localStorage.controller");

const parseFormData = require("../middlewares/parseFormData.middleware");
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const { SUPER_ADMIN, ADMIN } = require("../utils/constants");

const router = express.Router();

router.post(
    "/:sectionId",
    protect,
    allowedTo(ADMIN, SUPER_ADMIN),
    LocalStorageController.uploadSingleVideo("video"),
    LocalStorageController.uploadMultipleDocuments("attachments"),
    parseFormData(["isPreview"], []),  
    LessonValidator.validateAddLesson,
    LessonController.createLesson
)
router.patch(
    "/:id",
    protect,
    allowedTo(ADMIN, SUPER_ADMIN),
    LocalStorageController.uploadSingleVideo("video"),
    LocalStorageController.uploadMultipleDocuments("attachments"),
    parseFormData(["isPreview"], []),
    LessonValidator.validateUpdateLesson,
    LessonController.updateLesson    
)

router.delete(
    "/:id",
    protect,
    allowedTo(ADMIN, SUPER_ADMIN),
    LessonController.deleteLesson
)

module.exports = router;

