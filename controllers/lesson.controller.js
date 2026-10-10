const prisma = require('../startup/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('express-async-handler');
const BunnyService = require("../services/bunny.service");
const R2Service = require("../services/cloudflare.r2.service");

class LessonController {

    // @desc   Create a new lesson
    // @route  POST /lessons/:sectionId
    // @access Private
    createLesson = asyncHandler(async (req, res, next) => {
        const { sectionId } = req.params;
        const { title, description, isPreview } = req.body;

        if (!title) return next(new ApiError("Title is required", 400));

        const existingSection = await prisma.section.findFirst({
            where: { id: sectionId, isDeleted: false }
        });

        if (!existingSection) {
            return next(new ApiError("Section not found", 404));
        }

        const lastLesson = await prisma.lesson.findFirst({
            where: { sectionId, isDeleted: false },
            orderBy: { order: "desc" }
        });

        const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

        const attachmentKeys = await R2Service.uploadAttachments(req.files?.attachments);
        const bunnyVideo = await BunnyService.createVideo(title);

        const lesson = await prisma.lesson.create({
            data: {
                title,
                description,
                attachments: attachmentKeys,
                isPreview,
                order: nextOrder,
                sectionId,
                bunnyVideoId: bunnyVideo.guid,
                videoStatus: "UPLOADING"
            }
        });

        res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            data: {
                lesson: {
                    ...lesson,
                    attachments: await R2Service.getAttachmentLinks(lesson.attachments)
                },
                upload: BunnyService.signUpload(bunnyVideo.guid)
            }
        });
    });

    // @desc   Update a lesson
    // @route  PATCH /api/lessons/:id
    // @access Private
    updateLesson = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const { title, description, attachmentKeysToDelete, isPreview } = req.body;

        const existingLesson = await prisma.lesson.findFirst({
            where: { id, isDeleted: false }
        });

        if (!existingLesson) {
            return next(new ApiError("Lesson not found", 404));
        }

        let updatedAttachments = existingLesson.attachments;

        const keysToDelete = attachmentKeysToDelete
            ? [].concat(attachmentKeysToDelete)
            : [];

        if (keysToDelete.some((key) => !existingLesson.attachments.includes(key))) {
            return next(new ApiError("Invalid attachment key", 400));
        }

        updatedAttachments = updatedAttachments.filter(
            (key) => !keysToDelete.includes(key)
        );

        const newKeys = await R2Service.uploadAttachments(req.files?.attachments);
        updatedAttachments = [...updatedAttachments, ...newKeys];

        const lesson = await prisma.lesson.update({
            where: { id },
            data: {
                title,
                description,
                attachments: updatedAttachments,
                isPreview
            }
        });

        await Promise.all(keysToDelete.map(R2Service.deleteAttachment));

        res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            data: {
                ...lesson,
                attachments: await R2Service.getAttachmentLinks(lesson.attachments)
            }
        });
    });


}

module.exports = new LessonController();