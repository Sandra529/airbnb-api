import { Router } from "express";
import {
  getAllListings,
  searchListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
} from "../controllers/listings.controller";
import { getListingStats } from "../controllers/stats.controller";
import { authenticate, requireHost } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /listings/search:
 *   get:
 *     summary: Search listings with filters
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: guests
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
 *         description: Paginated search results
 */
router.get("/search", searchListings);

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
router.get("/stats", authenticate, getListingStats);

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     parameters:
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
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: pricePerNight
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of listings
 */
router.get("/", getAllListings);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get a listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing found
 *       404:
 *         description: Listing not found
 */
router.get("/:id", getListingById);

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingInput'
 *     responses:
 *       201:
 *         description: Listing created
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticate, requireHost, createListing);

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 */
router.put("/:id", authenticate, updateListing);

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Listings]
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
 *         description: Listing deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 */
router.delete("/:id", authenticate, deleteListing);

export default router;