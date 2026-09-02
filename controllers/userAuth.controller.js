const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const prisma = require("../startup/db");
const Auth = require("../utils/auth");
const ApiError = require("../utils/ApiError");
const oauthService = require("../services/oAuth.service");
const { OAUTH_PROVIDERS } = require("../utils/constants");
const { translate } = require("../utils/translation");
const { generateCode, hashCode } = require("../utils/generateCode");
// Controller classes
const { userVerificationEmail } = require("./email.controller");
const EmailController = require("./email.controller");

class UserController {
  #getUsersData = (user, lang = "en") => {
    return {
      _id: user.id,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      loginType: user.loginType,
    };
  };

  // @desc Login with google
  // @route POST /users/auth/google
  // @access Public
  googleAuth = asyncHandler(async (req, res, next) => {
    const { provider, token, notificationToken } = req.body;
    const lang = req.headers.lang || "en";

    if (!provider || !token) {
      return next(new ApiError(translate("Provider and token required", lang), 400));
    }

    const validProviders = Object.values(OAUTH_PROVIDERS);
    if (!validProviders.includes(provider)) {
      return next(new ApiError(translate("Invalid provider", lang), 400));
    }

    try {
      const { user, token: authToken, tokenExpDate } = await oauthService.handleOAuth(
        provider,
        token,
        notificationToken
      );

      res.status(200).json({
        success: true,
        message: `Welcome ${user.fullName}`,
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          createdAt: user.createdAt,
          role: user.role,
          isVerified: user.isVerified,
          loginType: user.loginType,
          token: authToken,
          tokenExpDate,
        },
      });
    } catch (error) {
        next(new ApiError(error.message || "Authentication failed", error.statusCode || 400));
    }
  });


  login = (user, loginType) =>
    asyncHandler(async (req, res, next) => {
      const { password, email } = req.body;
      const lang = req.headers.lang || "en";


      if (loginType && loginType !== user.loginType)
        return next(new ApiError(translate("Incorrect Email or password", lang), 403));
      else if (!loginType) {
        if (!(await Auth.comparePassword(user, password)))
          return next(new ApiError(translate("Incorrect Email or password", lang), 403));
      }

      // Response Msg
      let message = `Welcome back ${user.fullName || ""}!`;

      // Check if user account is deactivated
      if (!user.isActive) {
        const targetDate = new Date(user.deactivatedAt);
        const currentDate = new Date();
        const timeDifference = currentDate - targetDate;
        const millisecondsIn15Days = 15 * 24 * 60 * 60 * 1000;

        if (timeDifference >= millisecondsIn15Days) {
          return next(new ApiError(translate("Incorrect Email or password", lang), 404));
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              deactivatedAt: null,
              isActive: true
            }
          });
          message = "Welcome back! Your account has been reactivated.";
        }
      }

      // Check if account is verified
      if (!user.isVerified) {
        const { code, hashedCode } = await generateCode();
        const verifiedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationCode: hashedCode,
            verificationCodeExp: new Date(Date.now() + 10 * 60 * 1000)
          },
        });

        if (user.email) {
          await userVerificationEmail(code, user.email);

          return res.status(200).json({
            success: true,
            message: "Verification OTP is sent to your Email",
            data: {
              ...this.#getUsersData(user, lang)
            }
          });
        }
      }


      if (user.isBlocked)
        return next(
          new ApiError(
            translate("Your account is blocked, please contact the support team", lang),
            403
          )
        );

      // generate token
      const token = await Auth.generateToken(user.id, user.role);

      // Save notification token
      if (req.body.notificationToken) {
        await prisma.user.update({
          where: { id: user.id },
          data: { notificationToken: req.body.notificationToken }
        });
      }

      // Remove password from the response
      user.password = undefined;
      user.isVerified = undefined;
      user.isActive = undefined;

      // response
      res.status(200).json({
        success: true,
        message,
        data: {
          ...this.#getUsersData(user, lang),
          ...token
        }
      });
  });

  // @desc    Log In
  // @route   POST /users/auth/login
  // @access  Public
  userLogin = asyncHandler(async (req, res, next) => {
    const { email, password, phone } = req.body; 
    const lang = req.headers.lang || "en";

    const user = await prisma.user.findFirst({
      where: phone ? { phone } : { email }
    });

    if (!user) {
      return next(new ApiError(translate("Incorrect Email or password", lang), 403));
    }

    if (user.loginType !== "EMAIL") {
      return next(new ApiError(
        translate(`This account uses a different sign-in method. Please try another way to sign in.`, lang),
        409
      ));
    }

    return this.login(user)(req, res, next);
  });

  // @desc    Sign Up
  // @route   POST /users/auth/register
  // @access  Public
  userRegister = async (req, res, next) => {
    try {
      const { code, hashedCode } = await generateCode();

      const user = await prisma.user.create({
        data: {
          fullName: req.body.fullName,
          email: req.body.email,
          phone: req.body.phone,
          loginType: "EMAIL", 
          notificationToken: req.body.notificationToken,
          password: await Auth.hashPassword(req.body.password),
          verificationCode: hashedCode,
          verificationCodeExp: new Date(Date.now() + 10 * 60 * 1000)
        }
      });

      await userVerificationEmail(code, req.body.email);

      res.status(200).json({
        success: true,
        message: "Verification OTP is sent to your Email",
        data: {
          ...this.#getUsersData(user, req.headers.lang)
        }
      });
    } catch (err) {
      next(err);
    }
  };

  // @desc    User account verification
  // @route   POST /users/auth/verifyAccount
  // @access  Public
  userVerifyAccount = asyncHandler(async (req, res, next) => {
    const lang = req.headers.lang || "en";

    if (!req.body.code)
      return next(new ApiError(translate("Verification OTP is required", lang), 400));

    const hashedCode = crypto.createHash("sha256").update(req.body.code).digest("hex");

    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user || (!user.verificationCode && !user.verificationCodeExp))
      return next(new ApiError(translate("Invalid request", lang), 400));

    if (Date.now() >= Date.parse(user.verificationCodeExp))
      return next(new ApiError(translate("Verification OTP is expired", lang), 401));

    if (user.verificationCode !== hashedCode)
      return next(new ApiError(translate("Invalid Verification OTP", lang), 401));

    const updatedUser = await prisma.user.update({
      where: { email: req.body.email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExp: null,
        notificationToken: req.body.notificationToken
      },
    });

    const token = await Auth.generateToken(updatedUser.id, updatedUser.role);

    res.status(200).json({
      success: true,
      message: "Account verified successfully",
      data: {
        ...this.#getUsersData(updatedUser, lang),
        ...token
      }
    });
  });



}

module.exports = new UserController();
