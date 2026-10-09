const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");
const prisma = require("../startup/db");
const {
  phoneNumberValidator,
} = require("./validatorComponents");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");
const { LEVELS, STUDY_MODES } = require("../utils/constants");
const {
  checkIfPhoneStartsWithPlus2,
} = require("../middlewares/phoneNumberChecker.middleware");
  
class UserValidator {
  validateRegisterUser = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      fullName: Joi.string()
        .min(2)
        .max(32)
        .required()
        .messages({ "any.required": "Full Name is required" }),

      phone: Joi.string().custom(phoneNumberValidator).required().messages({
        "any.required": "Phone is required",
        "string.pattern.base": "Invalid Phone Number",
      }),
      
      parentPhone: Joi.string().custom(phoneNumberValidator).required().messages({
        "any.required": "Parent Phone is required",
        "string.pattern.base": "Invalid Parent Phone Number",
      }),

      level: Joi.string().valid(...LEVELS).required().messages({
        "any.required": "Level is required",
        "any.only": "Invalid Level value",
      }),
      
      groupeId: Joi.string().uuid().optional().messages({
        "any.required": "Group ID is required"
      }),

      studyMode: Joi.string().valid(...STUDY_MODES).required().messages({
        "any.required": "Study Mode is required",
        "any.only": "Invalid Study Mode",
      }),
      
      governmentId: Joi.string().uuid().required().messages({
        "any.required": "Government ID is required"
      }),

      password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
      }),

      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.required": "Confirm Password is required",
          "any.only": "Passwords do not match",
        }),

      notificationToken: Joi.string().optional(),
    });

    joiErrorHandler(schema, req);
    checkIfPhoneStartsWithPlus2(req);
    next();
  });

  validateLoginUser = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      phone: Joi.string().custom(phoneNumberValidator).required().messages({
        "any.required": "Phone is required",
        "string.pattern.base": "Invalid Phone Number",
      }),
      password: Joi.string().required().messages({
        "any.required": "Password is required",
      }),
      notificationToken: Joi.string().optional(),
    });

    joiErrorHandler(schema, req);
    checkIfPhoneStartsWithPlus2(req);
    next();
  });

  validateUpdateUser = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      fullName: Joi.string().optional().min(2).max(32),
      phone: Joi.string().custom(phoneNumberValidator).optional().messages({
        "string.pattern.base":
          "Phone number must start with '0' and contain exactly 11 digits",
      }),
      parentPhone: Joi.string().custom(phoneNumberValidator).optional(),
      level: Joi.string().valid(...LEVELS).optional(),
      groupeId: Joi.string().uuid().optional(),
      studyMode: Joi.string().valid(...STUDY_MODES).optional(),
      governmentId: Joi.string().uuid().optional(),
    });

    joiErrorHandler(schema, req);
    checkIfPhoneStartsWithPlus2(req);

    if (req.body.phone && req.body.phone !== req.user.phone) {
      const user = await prisma.user.findFirst({
        where: {
          phone: req.body.phone,
        },
      });

      if (user) {
        return next(
          new ApiError(
            translate("Duplicated Phone Number", req.headers.lang),
            400
          )
        );
      }
    }

    next();
  });

}

module.exports = new UserValidator();