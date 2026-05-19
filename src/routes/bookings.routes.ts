import { Router } from "express";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  deleteBooking,
  updateBookingStatus,
} from "../controllers/bookings.controller";
import { authenticate, requireGuest } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: 2026-06-01T00:00:00.000Z
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: 2026-06-05T00:00:00.000Z
 *         totalPrice:
 *           type: number
 *           example: 200
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *           example: PENDING
 *         guestId:
 *           type: integer
 *           example: 2
 *         listingId:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-01-01T00:00:00.000Z
 *     CreateBookingInput:
 *       type: object
 *       required:
 *         - listingId
 *         - checkIn
 *         - checkOut
 *       properties:
 *         listingId:
 *           type: integer
 *           example: 1
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: 2026-06-01
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: 2026-06-05
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authenticate, getAllBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
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
 *         description: Booking found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", authenticate, getBookingById);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: totalPrice is auto-calculated from pricePerNight x nights
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingInput'
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", authenticate, requireGuest, createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Bookings]
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
 *         description: Booking cancelled
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", authenticate, deleteBooking);

/**
 * @swagger
 * /bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED]
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/status", authenticate, updateBookingStatus);

export default router;