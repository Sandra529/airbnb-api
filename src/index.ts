import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth.routes";
import usersRouter from "./routes/users.routes";
import listingsRouter from "./routes/listings.routes";
import bookingsRouter from "./routes/bookings.routes";
import uploadRouter from "./routes/upload.routes";
import reviewsRouter from "./routes/reviews.routes";
import statsRouter from "./routes/stats.routes";
import v1Router from "./routes/v1/index";
import { connectDB } from "./config/prisma";
import { authenticate } from "./middlewares/auth.middleware";
import { setupSwagger } from "./config/swagger";
import { globalLimiter, authLimiter, strictLimiter } from "./middlewares/rateLimiter";
import { deprecateV1 } from "./middlewares/deprecation.middleware";

const app = express();
const PORT = Number(process.env["PORT"]) || 3000;

app.set("trust proxy", 1);

app.use(morgan(process.env["NODE_ENV"] === "production" ? "combined" : "dev"));

app.use(compression());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://airbnb-api-d2js.onrender.com",
  ],
  credentials: true,
}));

app.use(globalLimiter);
app.use(express.json());

setupSwagger(app);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

app.use("/api/v1", deprecateV1, v1Router);

app.use("/auth", authLimiter, authRouter);
app.use("/users", authenticate, usersRouter);
app.use("/", uploadRouter);
app.use("/listings", listingsRouter);
app.use("/bookings", bookingsRouter);
app.use("/", reviewsRouter);
app.use("/", statsRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

const main = async () => {
  await connectDB();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API v1 available at http://localhost:${PORT}/api/v1`);
  });
};

main();
