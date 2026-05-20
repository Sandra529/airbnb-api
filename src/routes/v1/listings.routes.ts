import { Router } from "express";
import {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  searchListings,
} from "../../controllers/listings.controller";
import { authenticate, requireHost } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/search", searchListings);
router.get("/", getAllListings);
router.get("/:id", getListingById);
router.post("/", authenticate, requireHost, createListing);
router.put("/:id", authenticate, updateListing);
router.delete("/:id", authenticate, deleteListing);

export default router;