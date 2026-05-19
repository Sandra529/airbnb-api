
import { Router } from "express";
import { getListingStats, getUserStats } from "../controllers/stats.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /listings/stats:
 *   get:
 *     summary: Get listing statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listing stats
 */
router.get("/listings/stats", authenticate, getListingStats);

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
router.get("/users/stats", authenticate, getUserStats);

export default router;