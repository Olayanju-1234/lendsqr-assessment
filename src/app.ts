import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./modules/auth/auth.routes";
import walletRoutes from "./modules/wallet/wallet.routes";
import transactionRoutes from "./modules/transaction/transaction.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// Trust proxy (required for Railway/Render behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests, please try again later" },
});
app.use(globalLimiter);

// Request logging
app.use(morgan("dev"));

// Body parsing middleware
app.use(express.json({ limit: "10kb" }));

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Demo Credit Wallet Service API",
    documentation: "/api/health",
  });
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Demo Credit API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
