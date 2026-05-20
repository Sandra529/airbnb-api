import { Router } from "express";
import prisma from "../../config/prisma";
import { authenticate } from "../../middlewares/auth.middleware";
import { getCache, setCache, deleteCache } from "../../config/cache";

const router = Router();

router.get("/listings/:id/reviews", async (req, res) => {
  try {
    const listingId = req.params.id as string;
    const pageNum = parseInt(req.query.page as string) || 1;
    const limitNum = parseInt(req.query.limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `reviews:${listingId}:${pageNum}:${limitNum}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { listingId },
        include: { user: { select: { name: true, avatar: true } } },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { listingId } }),
    ]);

    const result = {
      data: reviews,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };

    setCache(cacheKey, result, 30);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/listings/:id/reviews", authenticate, async (req, res) => {
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

    const review = await prisma.review.create({
      data: { rating, comment, listingId, userId: (req as any).userId },
    });

    deleteCache(`reviews:${listingId}`);
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/reviews/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id as string;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ message: "Review not found" });

    await prisma.review.delete({ where: { id } });
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;