import { Request, Response } from "express";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import prisma from "../config/prisma";
import { model, deterministicModel } from "../config/ai";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getCache, setCache, deleteCache } from "../config/cache";

// Session store for chatbot
const sessions = new Map<string, { role: string; content: string }[]>();

// POST /api/v1/ai/search
export const aiSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const pageNum = parseInt(req.query.page as string) || 1;
    const limitNum = parseInt(req.query.limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const prompt = `Extract search filters from this query: "${query}"
Return ONLY a JSON object with these fields (use null if not mentioned):
{
  "location": string or null,
  "type": "APARTMENT" | "HOUSE" | "VILLA" | "CABIN" or null,
  "maxPrice": number or null,
  "guests": number or null
}
Return ONLY the JSON, no explanation.`;

    const response = await deterministicModel.invoke([new HumanMessage(prompt)]);
    const content = response.content as string;

    let filters: any;
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      filters = JSON.parse(clean);
    } catch {
      return res.status(400).json({ message: "Could not parse AI response" });
    }

    if (!filters.location && !filters.type && !filters.maxPrice && !filters.guests) {
      return res.status(400).json({ message: "Could not extract any filters from your query, please be more specific" });
    }

    const where: any = {
      ...(filters.location && { location: { contains: filters.location, mode: "insensitive" } }),
      ...(filters.type && { type: filters.type }),
      ...(filters.maxPrice && { pricePerNight: { lte: filters.maxPrice } }),
      ...(filters.guests && { guests: { gte: filters.guests } }),
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
      filters,
      data: listings,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    if (error?.status === 429) return res.status(429).json({ message: "AI service is busy, please try again in a moment" });
    if (error?.status === 401) return res.status(500).json({ message: "AI service configuration error" });
    console.error("aiSearch error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /api/v1/ai/listings/:id/generate-description
export const generateDescription = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { tone = "professional" } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.hostId !== req.userId) {
      return res.status(403).json({ message: "You can only generate descriptions for your own listings" });
    }

    const toneInstructions: Record<string, string> = {
      professional: "Write in a formal, clear, business-like tone.",
      casual: "Write in a friendly, relaxed, conversational tone.",
      luxury: "Write in an elegant, premium, aspirational tone.",
    };

    const toneText = toneInstructions[tone] || toneInstructions.professional;

    const prompt = `Generate a compelling listing description for this property:
Title: ${listing.title}
Location: ${listing.location}
Type: ${listing.type}
Price per night: $${listing.pricePerNight}
Max guests: ${listing.guests}
Amenities: ${listing.amenities.join(", ")}

${toneText}
Write 2-3 sentences only. Return just the description, no extra text.`;

    const response = await model.invoke([new HumanMessage(prompt)]);
    const description = response.content as string;

    const updated = await prisma.listing.update({
      where: { id },
      data: { description },
    });

    res.json({ description, listing: updated });
  } catch (error: any) {
    if (error?.status === 429) return res.status(429).json({ message: "AI service is busy, please try again in a moment" });
    if (error?.status === 401) return res.status(500).json({ message: "AI service configuration error" });
    console.error("generateDescription error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /api/v1/ai/chat
export const chat = async (req: Request, res: Response) => {
  try {
    const { sessionId, message, listingId } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ message: "sessionId and message are required" });
    }

    let systemPrompt = "You are a helpful guest support assistant for an Airbnb-like platform.";

    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (listing) {
        systemPrompt = `You are a helpful guest support assistant for an Airbnb-like platform.
You are currently helping a guest with questions about this specific listing:

Title: ${listing.title}
Location: ${listing.location}
Price per night: $${listing.pricePerNight}
Max guests: ${listing.guests}
Type: ${listing.type}
Amenities: ${listing.amenities.join(", ")}
Description: ${listing.description}

Answer questions about this listing accurately based on the details above.
If asked something not covered by the listing details, say you don't have that information.`;
      }
    }

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }

    const history = sessions.get(sessionId)!;
    history.push({ role: "user", content: message });

    // Trim to last 10 exchanges (20 messages)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    const messages = [
      new SystemMessage(systemPrompt),
      ...history.map((h) =>
        h.role === "user" ? new HumanMessage(h.content) : new SystemMessage(h.content)
      ),
    ];

    const response = await model.invoke(messages);
    const reply = response.content as string;

    history.push({ role: "assistant", content: reply });
    sessions.set(sessionId, history);

    res.json({ response: reply, sessionId, messageCount: history.length });
  } catch (error: any) {
    if (error?.status === 429) return res.status(429).json({ message: "AI service is busy, please try again in a moment" });
    if (error?.status === 401) return res.status(500).json({ message: "AI service configuration error" });
    console.error("chat error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /api/v1/ai/recommend
export const recommend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const bookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (bookings.length === 0) {
      return res.status(400).json({ message: "No booking history found. Make some bookings first to get recommendations." });
    }

    const historySummary = bookings.map((b) =>
      `- ${b.listing.type} in ${b.listing.location} at $${b.listing.pricePerNight}/night for ${b.listing.guests} guests`
    ).join("\n");

    const prompt = `Based on this user's booking history:
${historySummary}

Analyze their preferences and return ONLY a JSON object:
{
  "preferences": "string describing what the user likes",
  "searchFilters": {
    "location": "string or null",
    "type": "APARTMENT" | "HOUSE" | "VILLA" | "CABIN" or null,
    "maxPrice": number or null,
    "guests": number or null
  },
  "reason": "string explaining the recommendation"
}
Return ONLY the JSON, no explanation.`;

    const response = await deterministicModel.invoke([new HumanMessage(prompt)]);
    const content = response.content as string;

    let aiResult: any;
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      aiResult = JSON.parse(clean);
    } catch {
      return res.status(500).json({ message: "AI returned invalid response" });
    }

    const bookedListingIds = bookings.map((b) => b.listingId);
    const { searchFilters } = aiResult;

    const where: any = {
      id: { notIn: bookedListingIds },
      ...(searchFilters.location && { location: { contains: searchFilters.location, mode: "insensitive" } }),
      ...(searchFilters.type && { type: searchFilters.type }),
      ...(searchFilters.maxPrice && { pricePerNight: { lte: searchFilters.maxPrice } }),
      ...(searchFilters.guests && { guests: { gte: searchFilters.guests } }),
    };

    const recommendations = await prisma.listing.findMany({
      where,
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      preferences: aiResult.preferences,
      reason: aiResult.reason,
      searchFilters,
      recommendations,
    });
  } catch (error: any) {
    if (error?.status === 429) return res.status(429).json({ message: "AI service is busy, please try again in a moment" });
    if (error?.status === 401) return res.status(500).json({ message: "AI service configuration error" });
    console.error("recommend error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /api/v1/ai/listings/:id/review-summary
export const reviewSummary = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const cacheKey = `review-summary:${id}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const reviews = await prisma.review.findMany({
      where: { listingId: id },
      include: { user: { select: { name: true } } },
    });

    if (reviews.length < 3) {
      return res.status(400).json({ message: "Not enough reviews to generate a summary (minimum 3 required)" });
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const reviewsText = reviews.map((r) =>
      `${r.user.name} (${r.rating}/5): ${r.comment}`
    ).join("\n");

    const prompt = `Analyze these guest reviews and return ONLY a JSON object:
${reviewsText}

Return ONLY this JSON:
{
  "summary": "2-3 sentence overall summary",
  "positives": ["thing1", "thing2", "thing3"],
  "negatives": ["thing1"] or []
}`;

    const response = await model.invoke([new HumanMessage(prompt)]);
    const content = response.content as string;

    let aiResult: any;
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      aiResult = JSON.parse(clean);
    } catch {
      return res.status(500).json({ message: "AI returned invalid response" });
    }

    const result = {
      summary: aiResult.summary,
      positives: aiResult.positives,
      negatives: aiResult.negatives,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    };

    setCache(cacheKey, result, 600);
    res.json(result);
  } catch (error: any) {
    if (error?.status === 429) return res.status(429).json({ message: "AI service is busy, please try again in a moment" });
    if (error?.status === 401) return res.status(500).json({ message: "AI service configuration error" });
    console.error("reviewSummary error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};