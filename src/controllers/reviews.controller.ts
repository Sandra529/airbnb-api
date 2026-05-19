import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { deleteCacheByPrefix } from "../config/cache";

// GET /listings/:id/reviews
export const getListingReviews = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id as string;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { listingId },
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { listingId } }),
    ]);

    res.json({
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /listings/:id/reviews
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = req.params.id as string;

    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const existing = await prisma.review.findFirst({
      where: { listingId, userId: req.userId },
    });
    if (existing) {
      return res.status(409).json({ message: "You already reviewed this listing" });
    }

    const review = await prisma.review.create({
      data: { rating, comment, listingId, userId: req.userId! },
      include: { user: { select: { name: true, avatar: true } } },
    });

    const avg = await prisma.review.aggregate({
      where: { listingId },
      _avg: { rating: true },
    });

    await prisma.listing.update({
      where: { id: listingId },
      data: { rating: avg._avg?.rating ?? undefined },
    });

    deleteCacheByPrefix("listings:");
    deleteCacheByPrefix("stats:");

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE /reviews/:id
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.userId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }

    await prisma.review.delete({ where: { id } });

    const avg = await prisma.review.aggregate({
      where: { listingId: review.listingId },
      _avg: { rating: true },
    });

    await prisma.listing.update({
      where: { id: review.listingId },
      data: { rating: avg._avg?.rating ?? null },
    });

    deleteCacheByPrefix("listings:");
    deleteCacheByPrefix("stats:");

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};