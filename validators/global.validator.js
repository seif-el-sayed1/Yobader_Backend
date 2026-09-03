const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");
const { checkIfPhoneStartsWithPlus2 } = require("../middlewares/phoneNumberChecker.middleware");
const { phoneNumberValidator } = require("./validatorComponents");

class GlobalValidator {
  validateLogin = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "any.required": "Email is required",
        "string.email": "Invalid Email Address"
      }),
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long",
        "any.required": "Password is required"
      }),
      notificationToken: Joi.string().optional().default(""),
    });

    joiErrorHandler(schema, req);
    next();
  });

  validateNewPassword = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long",
        "any.required": "Password is required"
      }),
      confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Confirm password must match password",
        "any.required": "Confirm password is required"
      })
    });
    joiErrorHandler(schema, req);
    next();
  });

  validateChangePassword = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      currentPassword: Joi.string().required().messages({
        "any.required": "Current password is required"
      }),
      newPassword: Joi.string().min(8).required().messages({
        "string.min": "New Password must be at least 8 characters long",
        "any.required": "Password is required"
      }),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
        "any.only": "Confirm password must match password",
        "any.required": "Confirm password is required"
      })
    });
    joiErrorHandler(schema, req);
    next();
  });

  sendOtpValidator = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      phone: Joi.string().custom(phoneNumberValidator).optional(),
      email: Joi.string().email().optional()
    }).xor("email", "phone");
    joiErrorHandler(schema, req);
    checkIfPhoneStartsWithPlus2(req);
    next();
  });

}

module.exports = new GlobalValidator();