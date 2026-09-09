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

    // @desc   Update a lesson
    // @route  PATCH /api/lessons/:id
    // @access Private
    updateLesson = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const {
            title,
            description,
            video,
            videoUrlToDelete,
            attachments,
            attachmentUrlToDelete,
            isPreview,
            duration
        } = req.body;

        const existingLesson = await prisma.lesson.findFirst({
            where: {
                id,
                isDeleted: false
            }
        });

        if (!existingLesson) {
            return next(new ApiError("Lesson not found", 404));
        }

        let updatedVideo = existingLesson.video;
        let updatedAttachments = existingLesson.attachments;

        if (videoUrlToDelete && existingLesson.video === videoUrlToDelete) {
            await LocalStorageController.deleteOldVideo(videoUrlToDelete);
            updatedVideo = null;
        }

        if (video) {
            updatedVideo = video;
        }

        if (attachmentUrlToDelete) {
            const urlsToDelete = Array.isArray(attachmentUrlToDelete)
                ? attachmentUrlToDelete
                : [attachmentUrlToDelete];

            await Promise.all(
                urlsToDelete.map(url =>
                    LocalStorageController.deleteOldDocument(url)
                )
            );

            updatedAttachments = updatedAttachments.filter(
                url => !urlsToDelete.includes(url)
            );
        }

        if (attachments && attachments.length > 0) {
            updatedAttachments = [...updatedAttachments, ...attachments];
        }

        const lesson = await prisma.lesson.update({
            where: { id },
            data: {
                title,
                description,
                video: updatedVideo,
                attachments: updatedAttachments,
                isPreview,
                duration
            }
        });

        res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            data: lesson
        });
    });

    // @desc   Delete a lesson 
    // @route  DELETE /lessons/:id
    // @access Private
    deleteLesson = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const existingLesson = await prisma.lesson.findFirst({
            where: { id },
        });

        if (!existingLesson) {
            return next(new ApiError("Lesson not found", 404));
        }

        if (existingLesson.video) {
            await LocalStorageController.deleteOldVideo(
                existingLesson.video
            );
        }

        if (existingLesson.attachments.length > 0) {
            await Promise.all(
                existingLesson.attachments.map(url =>
                    LocalStorageController.deleteOldDocument(url)
                )
            );
        }

        await prisma.lesson.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: "Lesson deleted successfully",
        });
    });

}

module.exports = new LessonController();