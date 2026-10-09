const asyncHandler = require("express-async-handler");
const prisma = require("../startup/db");
const { Prisma } = require("@prisma/client");
const { generateStudentCode } = require("../utils/generateStudentCode");
const Auth = require("../utils/auth");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");

class UserController {
  #getUsersData = (user, lang = "en") => {
    return {
      _id: user.id,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      parentPhone: user.parentPhone,
      level: user.level,
      studentCode: user.studentCode,
      studyMode: user.studyMode,
      createdAt: user.createdAt,
    };
  };

  // @desc    Log In
  // @route   POST /users/auth/login
  // @access  Public
  userLogin = asyncHandler(async (req, res, next) => {
    const { phone, password, notificationToken } = req.body; 
    const lang = req.headers.lang || "en";

    const user = await prisma.user.findFirst({
      where: { phone }
    });

    if (!user) {
      return next(new ApiError(translate("Incorrect Phone number or password", lang), 403));
    }

    if (!(await Auth.comparePassword(user, password))) {
      return next(new ApiError(translate("Incorrect Phone number or password", lang), 403));
    }

    let message = `Welcome back ${user.fullName || ""}!`;

    // Check if user account is deactivated
    if (!user.isActive) {
      const targetDate = new Date(user.deactivatedAt);
      const currentDate = new Date();
      const timeDifference = currentDate - targetDate;
      const millisecondsIn15Days = 15 * 24 * 60 * 60 * 1000;

      if (timeDifference >= millisecondsIn15Days) {
        return next(new ApiError(translate("Your account is deactivated", lang), 404));
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

    if (user.isBlocked) {
      return next(
        new ApiError(
          translate("Your account is blocked, please contact the support team", lang),
          403
        )
      );
    }

    // generate token
    const token = await Auth.generateToken(user.id, user.role);

    // Save notification token
    if (notificationToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { notificationToken }
      });
    }

    res.status(200).json({
      success: true,
      message,
      data: {
        ...this.#getUsersData(user, lang),
        ...token
      }
    });
  });

  // @desc    Sign Up
  // @route   POST /users/auth/register
  // @access  Public
  userRegister = asyncHandler(async (req, res, next) => {
    const {
      fullName,
      phone,
      parentPhone,
      level,
      groupeId,
      studyMode,
      governmentId,
      password,
      notificationToken,
    } = req.body;

    const hashedPassword = await Auth.hashPassword(password);

    const MAX_RETRIES = 5;
    let user;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        user = await prisma.user.create({
          data: {
            fullName,
            phone,
            parentPhone,
            level,
            groupeId,
            studyMode,
            governmentId,
            password: hashedPassword,
            notificationToken,
            isVerified: true,
            studentCode: generateStudentCode(),
          },
        });
        break;
      } catch (e) {
        const isCodeCollision =
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002" &&
          JSON.stringify(e.meta ?? {}).includes("studentCode");

        if (!isCodeCollision) throw e;;
      }
    }

    if (!user) {
      return next(
        new ApiError("Failed to generate student code, please try again", 500)
      );
    }

    const token = await Auth.generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        ...this.#getUsersData(user, req.headers.lang),
        ...token,
      },
    });
  });

   // @desc    Update logged user password
   // @route   PATCH /users/auth/updatePassword
   // @access  Private
  updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
    const lang = req.headers.lang || "en";

    if (!(await Auth.comparePassword(req.user, req.body.currentPassword)))
      return next(new ApiError(translate("Incorrect password", lang), 401));

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: await Auth.hashPassword(req.body.newPassword),
        passwordChangedAt: new Date()
      }
    });

    if (!user) return next(new ApiError("User not found", 404));

    res.status(200).json({
      success: true,
      message: "Password updated successfully, please login again"
    });
  });

  //@desc  Log Out
  //@route POST /users/auth/log-out
  //@access Private
  logOut = asyncHandler(async (req, res, next) => {
    const user = req.user;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        notificationToken: null,
        token: null,
        tokenExpDate: null
      }
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully!"
    });
  });

}

module.exports = new UserController();
