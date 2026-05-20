import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../../controllers/users.controller";
import prisma from "../../config/prisma";

const router = Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

router.get("/:id/listings", async (req, res) => {
  const id = req.params.id as string;
  const listings = await prisma.listing.findMany({ where: { hostId: id } });
  res.json(listings);
});

router.get("/:id/bookings", async (req, res) => {
  const id = req.params.id as string;
  const bookings = await prisma.booking.findMany({
    where: { guestId: id },
    include: { listing: true },
  });
  res.json(bookings);
});

export default router;