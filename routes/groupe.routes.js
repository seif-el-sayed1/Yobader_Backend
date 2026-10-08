const express = require("express");
const GroupeController = require("../controllers/groupe.controller");
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const { SUPER_ADMIN, ADMIN } = require("../utils/constants");

const router = express.Router();

router
  .route("/")
  .post(protect, allowedTo(ADMIN, SUPER_ADMIN), GroupeController.createGroupe)
  .get(GroupeController.getGroupes);

router
  .route("/:id")
  .get(GroupeController.getGroupe)
  .patch(protect, allowedTo(ADMIN, SUPER_ADMIN), GroupeController.updateGroupe)
  .delete(protect, allowedTo(ADMIN, SUPER_ADMIN), GroupeController.deleteGroupe);

module.exports = router;
