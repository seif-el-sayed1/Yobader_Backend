const appRouter = require("express").Router();
const BASE_URL = "/api/v1";
const ApiError = require("../utils/ApiError");

let adminRoutes = require("./admin.routes");
let adminAuthRoutes = require("./adminAuth.routes");

let userAuthRoutes = require("./userAuth.routes")
let userRoutes = require("./user.routes")

let courseRoutes = require("./course.routes");
let sectionRoutes = require("./section.routes");
let lessonRoutes = require("./lesson.routes");

appRouter.use(`${BASE_URL}/admins`, adminRoutes);
appRouter.use(`${BASE_URL}/admins/auth`, adminAuthRoutes);
appRouter.use(`${BASE_URL}/users/auth`, userAuthRoutes);
appRouter.use(`${BASE_URL}/users`, userRoutes);

appRouter.use(`${BASE_URL}/courses`, courseRoutes);
appRouter.use(`${BASE_URL}/sections`, sectionRoutes);
appRouter.use(`${BASE_URL}/lessons`, lessonRoutes);


appRouter.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    message: "You're Server is up and running!"
  });
});

// Not Found Route
appRouter.use((req, res, next) => {
  next(new ApiError(`This Route (${req.originalUrl}) is not found`, 404));
});


module.exports = appRouter;
