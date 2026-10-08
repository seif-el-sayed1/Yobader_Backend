const asyncHandler = require("express-async-handler");
const prisma = require("../startup/db");
const ApiError = require("../utils/ApiError");

class GroupeController {
  // @desc    Create a groupe
  // @route   POST /api/groupes
  // @access  Private/Admin
  createGroupe = asyncHandler(async (req, res, next) => {
    const { name, day, time } = req.body;
    
    if (!name || !day || !time) {
      return next(new ApiError("Name, day, and time are required", 400));
    }

    const groupe = await prisma.groupe.create({
      data: { name, day, time },
    });

    res.status(201).json({
      success: true,
      data: groupe,
    });
  });

  // @desc    Get all groupes
  // @route   GET /api/groupes
  // @access  Public
  getGroupes = asyncHandler(async (req, res, next) => {
    const groupes = await prisma.groupe.findMany();

    res.status(200).json({
      success: true,
      data: groupes,
    });
  });

  // @desc    Get single groupe
  // @route   GET /api/groupes/:id
  // @access  Public
  getGroupe = asyncHandler(async (req, res, next) => {
    const groupe = await prisma.groupe.findUnique({
      where: { id: req.params.id },
    });

    if (!groupe) return next(new ApiError("Groupe not found", 404));

    res.status(200).json({
      success: true,
      data: groupe,
    });
  });

  // @desc    Update groupe
  // @route   PATCH /api/groupes/:id
  // @access  Private/Admin
  updateGroupe = asyncHandler(async (req, res, next) => {
    const { name, day, time } = req.body;

    let groupe = await prisma.groupe.findUnique({
      where: { id: req.params.id },
    });

    if (!groupe) return next(new ApiError("Groupe not found", 404));

    groupe = await prisma.groupe.update({
      where: { id: req.params.id },
      data: { name, day, time },
    });

    res.status(200).json({
      success: true,
      data: groupe,
    });
  });

  // @desc    Delete groupe
  // @route   DELETE /api/groupes/:id
  // @access  Private/Admin
  deleteGroupe = asyncHandler(async (req, res, next) => {
    const groupe = await prisma.groupe.findUnique({
      where: { id: req.params.id },
    });

    if (!groupe) return next(new ApiError("Groupe not found", 404));

    await prisma.groupe.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      success: true,
      message: "Groupe deleted successfully",
    });
  });
}

module.exports = new GroupeController();
