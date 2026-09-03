const asycnHandler = require("express-async-handler");
const prisma = require("../startup/db");

class UserController {
    // @desc    Get my profile
    // @route   GET /api/v1/users/me
    // @access  Private (User)
    getMyProfile = asycnHandler(async (req, res) => {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                lang: true
            }
        });
        res.status(200).json({
            success: true,
            data: user,
        });
    });

    // @desc    Update my profile
    // @route   PATCH /api/v1/users/me
    // @access  Private (User)
    updateMyProfile = asycnHandler(async (req, res) => {
        const { fullName, phone } = req.body;
        const user = await prisma.user.update({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                phone: true,
                lang: true
            },
            data: {
                fullName,
                phone,
            }
        });
        res.status(200).json({
            success: true,
            data: user,
        });
    });

    // @desc get one user 
    // @route GET /api/v1/users/:id
    // @access Private 
    getOneUser = asycnHandler(async (req, res, next) => {
        const userId = req.params.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                lang: true
            }
        });
        res.status(200).json({
            success: true,
            data: user,
        });
    });

}

module.exports = new UserController();