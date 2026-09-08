const asyncHandler = require("express-async-handler");
const prisma = require("../startup/db");
const ApiError = require("../utils/ApiError");


class SectionController {
    // @desc    Create a new section
    // @route   POST sections/:courseId
    // @access  Private
    createSection = asyncHandler(async (req, res, next) => {
        const { courseId } = req.params;
        const { title } = req.body;

        if (!title?.trim()) {
            return next(new ApiError("Title is required", 400));
        }

        if (!courseId) {
            return next(new ApiError("Course is required", 400));
        }

        const course = await prisma.course.findFirst({
            where: { id: courseId, isDeleted: false },
        });

        if (!course) {
            return next(new ApiError("Course not found", 404));
        }

        const section = await prisma.$transaction(async (tx) => {
            const lastSection = await tx.section.findFirst({
                where: { courseId },
                orderBy: { order: "desc" },
            });

            const nextOrder = lastSection ? lastSection.order + 1 : 1;

            return tx.section.create({
                data: {
                    title: title.trim(),
                    order: nextOrder,
                    courseId,
                },
            });
        });

        res.status(201).json({
            success: true,
            message: "Section created successfully",
            data: section,
        });
    });
    
    // @desc    Update a section
    // @route   PATCH sections/:id
    // @access  Private
    updateSection = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const { title } = req.body;
    
        const existingSection = await prisma.section.findFirst({
            where: { id, isDeleted: false },
        });
    
        if (!existingSection) {
            return next(new ApiError("Section not found", 404));
        }
    
        const section = await prisma.section.update({
            where: { id },
            data: { title },
        });
    
        res.status(200).json({
            success: true,
            message: "Section updated successfully",
            data: section,
        });
    });

}


module.exports = new SectionController();


