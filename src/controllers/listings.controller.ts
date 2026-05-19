import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getCache, setCache, deleteCacheByPrefix } from "../config/cache";

// GET /listings
export const getAllListings = async (req: Request, res: Response) => {
  try {
    const { page, limit, location, type, maxPrice, sortBy, order } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `listings:all:${JSON.stringify(req.query)}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const where: any = {
      ...(location && { location: { contains: location as string, mode: "insensitive" } }),
      ...(type && { type: type as any }),
      ...(maxPrice && { pricePerNight: { lte: parseFloat(maxPrice as string) } }),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { host: { select: { name: true, avatar: true } } },
        orderBy: sortBy
          ? { [sortBy as string]: order === "desc" ? "desc" : "asc" }
          : { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.listing.count({ where }),
    ]);

    const result = {
      data: listings,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };

    setCache(cacheKey, result, 60);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /listings/search
export const searchListings = async (req: Request, res: Response) => {
  try {
    const { location, type, minPrice, maxPrice, guests, page, limit } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      ...(location && { location: { contains: location as string, mode: "insensitive" } }),
      ...(type && { type: type as any }),
      ...(guests && { guests: { gte: parseInt(guests as string) } }),
      ...((minPrice || maxPrice) && {
        pricePerNight: {
          ...(minPrice && { gte: parseFloat(minPrice as string) }),
          ...(maxPrice && { lte: parseFloat(maxPrice as string) }),
        },
      }),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { host: { select: { name: true, email: true } } },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      data: listings,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /listings/:id
export const getListingById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { host: true, bookings: true, photos: true },
    });

    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /listings
export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, location, pricePerNight, guests, type, amenities } = req.body;

    if (!title || !description || !location || !pricePerNight || !guests || !type || !amenities) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const listing = await prisma.listing.create({
      data: {
        title, description, location, pricePerNight,
        guests, type, amenities,
        hostId: req.userId!,
        rating: req.body.rating,
      },
    });

    deleteCacheByPrefix("listings:");
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// PUT /listings/:id
export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only edit your own listings" });
    }

    const updated = await prisma.listing.update({ where: { id }, data: req.body });

    deleteCacheByPrefix("listings:");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE /listings/:id
export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only delete your own listings" });
    }

    await prisma.listing.delete({ where: { id } });

    deleteCacheByPrefix("listings:");
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};