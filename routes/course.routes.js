const express = require("express");

const CourseController = require("../controllers/course.controller");
const CourseValidator = require("../validators/course.validator");
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const { SUPER_ADMIN, ADMIN } = require("../utils/constants");

const router = express.Router();

router
    .route("/")
    .get(CourseController.getAllCourses)
    .post(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        CourseValidator.validateCreateCourse,
        CourseController.createCourse
    );

router
    .route("/:id")
    .get(CourseController.getCourseById)
    .patch(
        protect,
        allowedTo(SUPER_ADMIN, ADMIN),
        CourseValidator.validateUpdateCourse,
        CourseController.updateCourse
    )
    .delete(
        protect,
        allowedTo(SUPER_ADMIN, ADMIN),
        CourseController.deleteCourse
    );

module.exports = router;