const asyncHandler = require('express-async-handler');
const prisma = require('../startup/db');
const ApiError = require('../utils/ApiError');
const ApiFeatures = require('../utils/ApiFeatures');
const LocalStorageController = require('./localStorage.controller');

class CourseController{

    // @desc Create Course
    // @route POST courses
    // @access Private
    createCourse = asyncHandler(async (req, res, next) => {
        const { title, description, slug, image, courseLevel, startDate,
                isFree, isPublished, hasDiscount, discountPercent } = req.body;

        const price = Number(req.body.price);
        const parsedIsFree = isFree === "true";
        const parsedIsPublished = isPublished === "true";
        const parsedHasDiscount = hasDiscount === "true";
        const parsedDiscountPercent = discountPercent ? Number(discountPercent) : 0;

        let finalPriceAfterDiscount = price;
        if (parsedHasDiscount && parsedDiscountPercent > 0) {
            finalPriceAfterDiscount = price - (price * parsedDiscountPercent) / 100;
        }

        const course = await prisma.course.create({
            data: {
                title,
                description,
                slug,
                image,
                courseLevel,
                startDate: new Date(startDate),
                isPublished: parsedIsPublished,
                isFree: parsedIsFree,
                price: parsedIsFree ? 0 : price,
                hasDiscount: parsedHasDiscount,
                discountPercent: parsedHasDiscount ? parsedDiscountPercent : 0,
                priceAfterDiscount: parsedIsFree ? 0 : finalPriceAfterDiscount,
            },
        });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: course,
        });
    });

    // @desc Update Course
    // @route PATCH courses/:id
    // @access Private
    updateCourse = asyncHandler(async (req, res, next) => {

        const { id } = req.params;
        const {
            title,
            description,
            slug,
            image,
            courseLevel,
            startDate,
            isFree,
            isPublished,
            hasDiscount,
            discountPercent,
        } = req.body;

        const existingCourse = await prisma.course.findFirst({
            where: { id, isDeleted: false },
        });

        if (!existingCourse) {
            return next(new ApiError("Course not found", 404));
        }

        const price = req.body.price !== undefined ? Number(req.body.price) : existingCourse.price;
        const parsedIsFree =
            isFree !== undefined ? isFree === "true" : existingCourse.isFree;
        const parsedIsPublished =
            isPublished !== undefined ? isPublished === "true" : existingCourse.isPublished;
        const parsedHasDiscount =
            hasDiscount !== undefined ? hasDiscount === "true" : existingCourse.hasDiscount;
        const parsedDiscountPercent =
            discountPercent !== undefined
                ? Number(discountPercent)
                : existingCourse.discountPercent;

        let finalPriceAfterDiscount = price;
        if (parsedHasDiscount && parsedDiscountPercent > 0) {
            finalPriceAfterDiscount = price - (price * parsedDiscountPercent) / 100;
        }

        if (image && existingCourse.image) {
            await LocalStorageController.deleteOldImage(existingCourse.image);
        }

        const course = await prisma.course.update({
            where: { id },
            data: {
                title: title ?? existingCourse.title,
                description: description ?? existingCourse.description,
                slug: slug ?? existingCourse.slug,
                image: image ?? existingCourse.image,
                courseLevel: courseLevel ?? existingCourse.courseLevel,
                startDate: startDate ? new Date(startDate) : existingCourse.startDate,
                isPublished: parsedIsPublished,
                isFree: parsedIsFree,
                price: parsedIsFree ? 0 : price,
                hasDiscount: parsedHasDiscount,
                discountPercent: parsedHasDiscount ? parsedDiscountPercent : 0,
                priceAfterDiscount: parsedIsFree ? 0 : finalPriceAfterDiscount,
            },
        });

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: course,
        });
    });

    // @desc Delete Course
    // @route DELETE courses/:id
    // @access Private
    deleteCourse = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const existingCourse = await prisma.course.findFirst({
            where: { id, isDeleted: false },
            include: {
                sections: {
                    include: {
                        lessons: true,
                    },
                },
            },
        });

        if (!existingCourse) {
            return next(new ApiError("Course not found", 404));
        }

        const sectionIds = existingCourse.sections.map((s) => s.id);
        const lessonIds = existingCourse.sections.flatMap((s) =>
            s.lessons.map((l) => l.id)
        );

        await prisma.$transaction(async (tx) => {
            if (lessonIds.length > 0) {
                await tx.lessonProgress.deleteMany({
                    where: { lessonId: { in: lessonIds } },
                });
            }

            if (sectionIds.length > 0) {
                await tx.lesson.deleteMany({
                    where: { sectionId: { in: sectionIds } },
                });
            }

            await tx.section.deleteMany({
                where: { courseId: id },
            });

            await tx.enrollment.deleteMany({ where: { courseId: id } });
            await tx.coupon.deleteMany({ where: { courseId: id } });
            await tx.payment.deleteMany({ where: { courseId: id } });

            await tx.course.delete({
                where: { id },
            });
        });

        if (existingCourse.image) {
            await LocalStorageController.deleteOldImage(existingCourse.image);
        }

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    });

}

module.exports = new CourseController();