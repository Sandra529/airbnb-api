import { Router } from "express";
import {
  getListingReviews,
  createReview,
  deleteReview,
} from "../controllers/reviews.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         comment:
 *           type: string
 *           example: Great place to stay!
 *         userId:
 *           type: integer
 *           example: 2
 *         listingId:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /listings/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a listing
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of reviews
 *       404:
 *         description: Listing not found
 */
router.get("/listings/:id/reviews", getListingReviews);

/**
 * @swagger
 * /listings/{id}/reviews:
 *   post:
 *     summary: Create a review for a listing
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: Great place to stay!
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Missing fields or invalid rating
 *       409:
 *         description: Already reviewed this listing
 */
router.post("/listings/:id/reviews", authenticate, createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Review deleted
 *       403:
 *         description: Not your review
 *       404:
 *         description: Review not found
 */
router.delete("/reviews/:id", authenticate, deleteReview);

export default router;