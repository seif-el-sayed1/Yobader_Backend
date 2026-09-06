const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");
const { COURSE_LEVELS } = require("../utils/constants");


class CourseValidator {
    validateCreateCourse = asyncHandler(async (req, res, next) => {
        const schema = Joi.object({
            title: Joi.string().required().messages({
                "any.required": "Title is required",
            }),
            description: Joi.string().required().messages({
                "any.required": "Description is required",
            }),
            slug: Joi.string().required().messages({
                "any.required": "Slug is required",
            }),
            price: Joi.number().required().messages({
                "any.required": "Price is required",
            }),
            image: Joi.string().required().messages({
                "any.required": "Image is required",
            }),
            courseLevel: Joi.string().valid(...COURSE_LEVELS).required().messages({
                "any.required": "Course Level is required",
                "any.only": `Course Level must be one of ${COURSE_LEVELS.join(", ")}`,
            }),
            startDate: Joi.date().required().messages({
                "any.required": "Start Date is required",
            }),
            isFree: Joi.boolean().optional(),
            isPublished: Joi.boolean().optional(),
            hasDiscount: Joi.boolean().optional(),
            discountPercent: Joi.number()
            .min(10)
            .max(100)
            .when("hasDiscount", {
                is: true,
                then: Joi.required().messages({
                "any.required": "Discount Percent is required",
                }),
                otherwise: Joi.forbidden(),
            })
            .messages({
                "number.min": "Discount Percent must be at least 10",
                "number.max": "Discount Percent cannot exceed 100",
            }),
            priceAfterDiscount: Joi.number().optional()
        });
        joiErrorHandler(schema, req);
        next();
    })

    validateUpdateCourse = asyncHandler(async (req, res, next) => {
        const schema = Joi.object({
            title: Joi.string().optional(),
            description: Joi.string().optional(),
            slug: Joi.string().optional(),
            price: Joi.number().optional(),
            image: Joi.string().optional(),
            courseLevel: Joi.string().valid(...COURSE_LEVELS).optional().messages({
                "any.only": `Course Level must be one of ${COURSE_LEVELS.join(", ")}`,
            }),
            startDate: Joi.date().optional(),
            isFree: Joi.boolean().optional(),
            isPublished: Joi.boolean().optional(),
            hasDiscount: Joi.boolean().optional(),
            discountPercent: Joi.number()
                .min(10)
                .max(100)
                .when("hasDiscount", {
                    is: true,
                    then: Joi.required().messages({
                        "any.required": "Discount Percent is required",
                    }),
                    otherwise: Joi.forbidden(),
                })
                .messages({
                    "number.min": "Discount Percent must be at least 10",
                    "number.max": "Discount Percent cannot exceed 100",
                }),
            priceAfterDiscount: Joi.forbidden(),
        }).min(1).messages({
            "object.min": "At least one field must be provided to update",
        });

        joiErrorHandler(schema, req);
        next();
    })
}

module.exports = new CourseValidator();