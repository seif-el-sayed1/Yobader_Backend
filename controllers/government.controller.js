const asyncHandler = require("express-async-handler");
const prisma = require("../startup/db");
const ApiError = require("../utils/ApiError");

class GovernmentController {
  // @desc    Create a government
  // @route   POST /api/governments
  // @access  Private/Admin
  createGovernment = asyncHandler(async (req, res, next) => {
    const { name } = req.body;
    
    if (!name) return next(new ApiError("Government name is required", 400));

    const government = await prisma.government.create({
      data: { name },
    });

    res.status(201).json({
      success: true,
      data: government,
    });
  });

  // @desc    Get all governments
  // @route   GET /api/governments
  // @access  Public
  getGovernments = asyncHandler(async (req, res, next) => {
    const governments = await prisma.government.findMany({
      where: { isDeleted: false },
    });

    res.status(200).json({
      success: true,
      data: governments,
    });
  });

  // @desc    Get single government
  // @route   GET /api/governments/:id
  // @access  Public
  getGovernment = asyncHandler(async (req, res, next) => {
    const government = await prisma.government.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!government) return next(new ApiError("Government not found", 404));

    res.status(200).json({
      success: true,
      data: government,
    });
  });

  // @desc    Update government
  // @route   PATCH /api/governments/:id
  // @access  Private/Admin
  updateGovernment = asyncHandler(async (req, res, next) => {
    const { name } = req.body;

    let government = await prisma.government.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!government) return next(new ApiError("Government not found", 404));

    government = await prisma.government.update({
      where: { id: req.params.id },
      data: { name },
    });

    res.status(200).json({
      success: true,
      data: government,
    });
  });

  // @desc    Delete government
  // @route   DELETE /api/governments/:id
  // @access  Private/Admin
  deleteGovernment = asyncHandler(async (req, res, next) => {
    let government = await prisma.government.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!government) return next(new ApiError("Government not found", 404));

    await prisma.government.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    res.status(200).json({
      success: true,
      message: "Government deleted successfully",
    });
  });
}

module.exports = new GovernmentController();
