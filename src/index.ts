import "dotenv/config";
import express from "express";
import compression from "compression";
import authRouter from "./routes/auth.routes";
import usersRouter from "./routes/users.routes";
import listingsRouter from "./routes/listings.routes";
import bookingsRouter from "./routes/bookings.routes";
import uploadRouter from "./routes/upload.routes";
import reviewsRouter from "./routes/reviews.routes";
import statsRouter from "./routes/stats.routes";
import { connectDB } from "./config/prisma";
import { authenticate } from "./middlewares/auth.middleware";
import { setupSwagger } from "./config/swagger";
import { globalLimiter, authLimiter, strictLimiter } from "./middlewares/rateLimiter";

const app = express();
const PORT = process.env["PORT"] || 3000;

// Compression
app.use(compression());

// Global rate limiter
app.use(globalLimiter);

app.use(express.json());

// Swagger docs
setupSwagger(app);

// API versioning prefix
const v1 = express.Router();

// Public routes
v1.use("/auth", authLimiter, authRouter);

// Strict limiter on POST routes
v1.use(strictLimiter);

// Protected routes
v1.use("/users", authenticate, usersRouter);

// Upload routes
v1.use("/", uploadRouter);

// Mixed routes
v1.use("/listings", listingsRouter);
v1.use("/bookings", bookingsRouter);

// Reviews and Stats
v1.use("/", reviewsRouter);
v1.use("/", statsRouter);

// Mount v1 under /api/v1
app.use("/api/v1", v1);

// Keep old routes working too (backward compatibility)
app.use("/auth", authLimiter, authRouter);
app.use("/users", authenticate, usersRouter);
app.use("/", uploadRouter);
app.use("/listings", listingsRouter);
app.use("/bookings", bookingsRouter);
app.use("/", reviewsRouter);
app.use("/", statsRouter);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const main = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API v1 available at http://localhost:${PORT}/api/v1`);
  });
};

main();