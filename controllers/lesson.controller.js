const prisma = require('../startup/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('express-async-handler');
const LocalStorageController = require('./localStorage.controller');

class LessonController {

    // @desc   Create a new lesson
    // @route  POST /api/lessons/:sectionId
    // @access Private
    createLesson = asyncHandler(async (req, res, next) => {
        const { sectionId } = req.params;

        const {
            title,
            description,
            video,
            attachments,
            duration,
            isPreview
        } = req.body;

        const existingSection = await prisma.section.findFirst({
            where: {
                id: sectionId,
                isDeleted: false
            }
        });

        if (!existingSection) {
            return next(new ApiError("Section not found", 404));
        }

        const lastLesson = await prisma.lesson.findFirst({
            where: {
                sectionId,
                isDeleted: false
            },
            orderBy: {
                order: "desc"
            }
        });

        const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

        const lesson = await prisma.lesson.create({
            data: {
                title,
                description,
                video: video ?? null,
                attachments: attachments ?? [],
                duration,
                isPreview,
                order: nextOrder,
                sectionId
            }
        });

        res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            data: lesson
        });
    });


}

module.exports = new LessonController();