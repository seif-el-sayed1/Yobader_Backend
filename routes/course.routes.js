const express = require("express");

const CourseController = require("../controllers/course.controller");
const CourseValidator = require("../validators/course.validator");
const LocalStorageController = require("../controllers/localStorage.controller");
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const { SUPER_ADMIN, ADMIN, USER } = require("../utils/constants");

const router = express.Router();

router
    .route("/")
    .post(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        LocalStorageController.uploadSingleImage("image"),
        CourseValidator.validateCreateCourse,
        CourseController.createCourse
    )
    .get(
        protect,
        allowedTo(SUPER_ADMIN, ADMIN, USER),
        CourseController.getAllCourses
    );

router
    .route("/:id")
    .get(
        protect,
        allowedTo(SUPER_ADMIN, ADMIN, USER),
        CourseController.getCourseById
    )
    .patch(
        protect,
        allowedTo(SUPER_ADMIN, ADMIN),
        LocalStorageController.uploadSingleImage("image"),
        CourseValidator.validateUpdateCourse,
        CourseController.updateCourse
    ).delete(
        protect,
        allowedTo(SUPER_ADMIN, ADMIN),
        CourseController.deleteCourse
    );

module.exports = router;