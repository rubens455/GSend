import 'dotenv/config';
import express, { type Request, Response, NextFunction, Router } from "express";
import { createServer } from "http";
import { registerApiRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { SupabaseStorage } from "./supabase-storage";

const app = express();
const server = createServer(app);

// Diagnostic middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[REQUEST LOGGER]: ${req.method} ${req.originalUrl}`);
  console.log(`[PATH INFO]: req.path = "${req.path}", req.originalUrl = "${req.originalUrl}"`);
  if (req.path.startsWith('/api')) {
    console.log(`[API REQUEST]: This should be handled by API router`);
  }
  next();
});

app.use(express.json());


app.use(express.urlencoded({ extended: false }));


// Initialize Supabase storage
const storage = new SupabaseStorage();
console.log(`[DEBUG] Storage instance created:`, storage.constructor.name);

// Separated API router
const apiRouter = Router();
console.log(`[DEBUG] About to register API routes...`);
try {
  registerApiRoutes(apiRouter, storage);
  console.log(`[DEBUG] API routes registered successfully`);
} catch (error) {
  console.error(`[DEBUG] Error registering API routes:`, error);
  throw error;
}
app.use("/api", apiRouter);

console.log(`[DEBUG] API router mounted at /api`);

// Add 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Add logging to show when API routes are registered
console.log("API routes registered with /api prefix");

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handling middleware MUST be last
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (app.get("env") === "development") {
      console.error(err);
    }
    res.status(status).json({ message });
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
