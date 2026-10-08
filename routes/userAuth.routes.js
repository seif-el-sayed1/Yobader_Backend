const express = require("express");

const { USER } = require("../utils/constants");

// Middlewares
const { protect, allowedTo } = require("../middlewares/auth.middleware");
// const FirebaseController = require("../controllers/firebase.controller");
const upload = require("../middlewares/upload.middleware");
// Classes
const UserAuthController = require("../controllers/userAuth.controller");
// const UserResetPasswordController = require("../controllers/userResetPassword.controllers");
const UserValidator = require("../validators/user.validator");
const GlobalValidator = require("../validators/global.validator");

// Router
const router = express.Router();

// Auth Routes
router.route("/register").post(
  UserValidator.validateRegisterUser,
  UserAuthController.userRegister
);

router.route("/login").post(UserValidator.validateLoginUser, UserAuthController.userLogin);


router.patch(
  "/change-password",
  protect,
  allowedTo(USER),
  GlobalValidator.validateChangePassword,
  UserAuthController.updateLoggedUserPassword
);

router.post("/log-out", protect, allowedTo(USER), UserAuthController.logOut);

module.exports = router;
