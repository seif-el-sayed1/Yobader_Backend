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


}

module.exports = new CourseController();