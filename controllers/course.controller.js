const asyncHandler = require('express-async-handler');
const prisma = require('../startup/db');
const ApiError = require('../utils/ApiError');
const ApiFeatures = require('../utils/ApiFeatures');
const R2Service = require('../services/cloudflare.r2.service');

class CourseController{

    // @desc Create Course
    // @route POST courses
    // @access Private
    createCourse = asyncHandler(async (req, res, next) => {
        const { title, description, slug, level,
                isFree, isPublished, hasDiscount, discountPercent } = req.body;

        const imageFile = req.files?.image?.[0];
        if (!imageFile) return next(new ApiError("Image is required", 400));
        if (!imageFile.mimetype.startsWith("image/")) {
            return next(new ApiError("Image must be an image file", 400));
        }

        const price = Number(req.body.price);
        const parsedIsFree = isFree === "true";
        const parsedIsPublished = isPublished === "true";
        const parsedHasDiscount = hasDiscount === "true";
        const parsedDiscountPercent = discountPercent ? Number(discountPercent) : 0;

        let finalPriceAfterDiscount = price;
        if (parsedHasDiscount && parsedDiscountPercent > 0) {
            finalPriceAfterDiscount = price - (price * parsedDiscountPercent) / 100;
        }

        const imageUrl = await R2Service.uploadImage(imageFile);

        let course;
        try {
            course = await prisma.course.create({
                data: {
                    title,
                    description,
                    slug,
                    image: imageUrl,
                    level,
                    isPublished: parsedIsPublished,
                    isFree: parsedIsFree,
                    price: parsedIsFree ? 0 : price,
                    hasDiscount: parsedHasDiscount,
                    discountPercent: parsedHasDiscount ? parsedDiscountPercent : 0,
                    priceAfterDiscount: parsedIsFree ? 0 : finalPriceAfterDiscount,
                },
            });
        } catch (err) {
            await R2Service.deleteImage(imageUrl).catch(() => {});
            throw err;
        }

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
            courseLevel,
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

        const imageFile = req.files?.image?.[0];
        if (imageFile && !imageFile.mimetype.startsWith("image/")) {
            return next(new ApiError("Image must be an image file", 400));
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

        const newImageUrl = imageFile ? await R2Service.uploadImage(imageFile) : null;

        let course;
        try {
            course = await prisma.course.update({
                where: { id },
                data: {
                    title: title ?? existingCourse.title,
                    description: description ?? existingCourse.description,
                    slug: slug ?? existingCourse.slug,
                    image: newImageUrl ?? existingCourse.image,
                    courseLevel: courseLevel ?? existingCourse.courseLevel,
                    isPublished: parsedIsPublished,
                    isFree: parsedIsFree,
                    price: parsedIsFree ? 0 : price,
                    hasDiscount: parsedHasDiscount,
                    discountPercent: parsedHasDiscount ? parsedDiscountPercent : 0,
                    priceAfterDiscount: parsedIsFree ? 0 : finalPriceAfterDiscount,
                },
            });
        } catch (err) {
            if (newImageUrl) await R2Service.deleteImage(newImageUrl).catch(() => {});
            throw err;
        }

        if (newImageUrl && existingCourse.image) {
            await R2Service.deleteImage(existingCourse.image).catch((err) =>
                console.error("Old image cleanup failed:", err.message)
            );
        }

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
        });

        if (!existingCourse) {
            return next(new ApiError("Course not found", 404));
        }

        await prisma.course.update({
            where: { id },
            data: {
                isDeleted: true,
                isPublished: false,
                slug: `${existingCourse.slug}-deleted-${Date.now()}`,
            },
        });

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    });


    // TODO: stay need enhancement
    
    // @desc Get all courses
    // @route GET courses
    // @access Public
    getAllCourses = asyncHandler(async (req, res) => {
        const courseInclude = {
            sections: {
                where: { isDeleted: false },
                orderBy: { order: "asc" },
                include: {
                    lessons: {
                        where: { isDeleted: false },
                        orderBy: { order: "asc" },
                    },
                },
            },
        };

        const apiFeatures = new ApiFeatures(
            prisma.course,
            req.query,
            "Course",
            {
                where: { isDeleted: false, isPublished: true },
                include: courseInclude,
            }
        )
            .search()
            .filter()
            .sort()
            .paginate();

        apiFeatures.prismaArgs.where.isDeleted = false;
        apiFeatures.prismaArgs.where.isPublished = true;

        await apiFeatures.calculatePagination();

        const courses = await apiFeatures.execute();

        res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            pagination: apiFeatures.paginationResult,
            results: courses.length,
            data: courses,
        });
    });

    // @desc Get course by id
    // @route GET courses/:id
    // @access Public
    getCourseById = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const course = await prisma.course.findFirst({
            where: {
                id,
                isDeleted: false,
                isPublished: true,
            },
            include: {
                sections: {
                    where: { isDeleted: false },
                    orderBy: { order: "asc" },
                    include: {
                        lessons: {
                            where: { isDeleted: false },
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        if (!course) {
            return next(new ApiError("Course not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "Course fetched successfully",
            data: course,
        });
    });

}

module.exports = new CourseController();