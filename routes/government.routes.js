const express = require("express");
const GovernmentController = require("../controllers/government.controller");
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const { SUPER_ADMIN, ADMIN } = require("../utils/constants");

const router = express.Router();

router
  .route("/")
  .post(protect, allowedTo(ADMIN, SUPER_ADMIN), GovernmentController.createGovernment)
  .get(GovernmentController.getGovernments);

router
  .route("/:id")
  .get(GovernmentController.getGovernment)
  .patch(protect, allowedTo(ADMIN, SUPER_ADMIN), GovernmentController.updateGovernment)
  .delete(protect, allowedTo(ADMIN, SUPER_ADMIN), GovernmentController.deleteGovernment);

module.exports = router;
