const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");

class LessonValidator {

  validateAddLesson = asyncHandler(async (req, res, next) => {
      const schema = Joi.object({
          title: Joi.string().required().messages({
              "any.required": "Title is required",
          }),
          description: Joi.string().optional(),
          video: Joi.string().required().messages({
              "any.required": "Video is required",
          }),
          attachments: Joi.array().items(Joi.string()).optional(),
          isPreview: Joi.boolean().optional(),
          duration: Joi.number().optional(),
      });

      joiErrorHandler(schema, req);
      next();
  });

  validateUpdateLesson = asyncHandler(async (req, res, next) => {
      const schema = Joi.object({
          title: Joi.string().optional(),
          description: Joi.string().optional(),
          video: Joi.string().optional(),
          videoUrlToDelete: Joi.string().optional(),
          attachments: Joi.array()
              .items(Joi.string())
              .optional(),
          attachmentUrlToDelete: Joi.alternatives()
              .try(
                  Joi.string(),
                  Joi.array().items(Joi.string())
              )
              .optional(),
          isPreview: Joi.boolean().optional(),
          duration: Joi.number().optional(),

      }).min(1).messages({
          "object.min": "At least one field must be provided to update",
      });

      joiErrorHandler(schema, req);

      next();
  });
}

module.exports = new LessonValidator();