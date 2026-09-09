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

}

module.exports = new LessonValidator();