import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendEmail } from "../config/email";
import {
  bookingConfirmationEmail,
  bookingCancellationEmail,
} from "../templates/emails";

// GET /bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        include: {
          guest: { select: { name: true, avatar: true } },
          listing: { select: { title: true } },
        },
        skip,
        take: limit,
      }),
      prisma.booking.count(),
    ]);

    res.json({
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /bookings/:id
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { guest: true, listing: true },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /bookings
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, checkIn, checkOut } = req.body;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const listing = await prisma.listing.findFirst({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const days = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days <= 0) {
      return res.status(400).json({ message: "checkOut must be after checkIn" });
    }

    const totalPrice = days * listing.pricePerNight;

    const booking = await prisma.booking.create({
      data: {
        guestId: req.userId!,
        listingId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        status: "PENDING",
      },
    });

    res.status(201).json(booking);

    try {
      const guest = await prisma.user.findUnique({ where: { id: req.userId } });
      if (guest) {
        await sendEmail(
          guest.email,
          "Booking Confirmed!",
          bookingConfirmationEmail(
            guest.name,
            listing.title,
            listing.location,
            checkInDate.toDateString(),
            checkOutDate.toDateString(),
            totalPrice
          )
        );
      }
    } catch (emailError) {
      console.error("Booking confirmation email failed:", emailError);
    }
  } catch (error) {
    console.error("createBooking error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE /bookings/:id
export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const booking = await prisma.booking.findFirst({
      where: { id },
      include: { listing: true, guest: true },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.guestId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only cancel your own bookings" });
    }

    await prisma.booking.delete({ where: { id } });
    res.status(204).send();

    try {
      await sendEmail(
        booking.guest.email,
        "Booking Cancelled",
        bookingCancellationEmail(
          booking.guest.name,
          booking.listing.title,
          booking.checkIn.toDateString(),
          booking.checkOut.toDateString()
        )
      );
    } catch (emailError) {
      console.error("Booking cancellation email failed:", emailError);
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// PATCH /bookings/:id/status
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status must be PENDING, CONFIRMED or CANCELLED" });
    }

    const existing = await prisma.booking.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Booking not found" });

    const booking = await prisma.booking.update({ where: { id }, data: { status } });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};