const express = require("express");

const SectionController = require("../controllers/section.controller");
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const { SUPER_ADMIN, ADMIN, USER } = require("../utils/constants");

const router = express.Router();


router
    .route("/:courseId")
    .post(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        SectionController.createSection
    );

router
    .route("/:id")
    .get(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN, USER),
        SectionController.getSectionById
    )
    .patch(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        SectionController.updateSection
    ).delete(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        SectionController.deleteSection
    )

module.exports = router;