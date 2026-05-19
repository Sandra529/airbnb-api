import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller";
import { getUserStats } from "../controllers/stats.controller";
import { authenticate } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

const router = Router();

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats
 */
router.get("/stats", authenticate, getUserStats);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Missing required fields
 */
router.post("/", createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.put("/:id", updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete("/:id", deleteUser);

// GET /users/:id/listings
router.get("/:id/listings", async (req, res) => {
  const id = req.params.id as string;
  const listings = await prisma.listing.findMany({ where: { hostId: id } });
  res.json(listings);
});

// GET /users/:id/bookings
router.get("/:id/bookings", async (req, res) => {
  const id = req.params.id as string;
  const bookings = await prisma.booking.findMany({
    where: { guestId: id },
    include: { listing: true },
  });
  res.json(bookings);
});

export default router;