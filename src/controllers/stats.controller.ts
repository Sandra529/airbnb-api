
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getCache, setCache } from "../config/cache";

// GET /listings/stats
export const getListingStats = async (req: Request, res: Response) => {
  try {
    const cacheKey = "stats:listings";
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const [totalListings, avgPrice, byLocation, byType] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.aggregate({ _avg: { pricePerNight: true } }),
      prisma.listing.groupBy({
        by: ["location"],
        _count: { location: true },
        orderBy: { _count: { location: "desc" } },
      }),
      prisma.listing.groupBy({
        by: ["type"],
        _count: { type: true },
      }),
    ]);

    const stats = {
      totalListings,
      averagePrice: Math.round((avgPrice._avg.pricePerNight ?? 0) * 100) / 100,
      byLocation,
      byType,
    };

    setCache(cacheKey, stats, 300);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /users/stats
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const cacheKey = "stats:users";
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const [totalUsers, byRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
    ]);

    const stats = {
      totalUsers,
      byRole,
    };

    setCache(cacheKey, stats, 300);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};