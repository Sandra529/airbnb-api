import { Router } from "express";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  deleteBooking,
  updateBookingStatus,
} from "../../controllers/bookings.controller";
import { authenticate, requireGuest } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate, getAllBookings);
router.get("/:id", authenticate, getBookingById);
router.post("/", authenticate, requireGuest, createBooking);
router.delete("/:id", authenticate, deleteBooking);
router.patch("/:id/status", authenticate, updateBookingStatus);

export default router;