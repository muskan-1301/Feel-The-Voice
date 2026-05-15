import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import mlRoutes from "./backend/routes/mlRoutes.js";
import { mlPipelineLogger, validateAudioMetadata } from "./backend/middleware/mlLogger.js";

// override logic removed

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parsing middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Add ML Pipeline Logger
  app.use(mlPipelineLogger);

  // Mount ML routes
  app.use('/api/ml', mlRoutes);

  // API Backend routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running!" });
  });

  // Example backend capabilities demo
  app.get("/api/data", (req, res) => {
    res.json({
      message: "ML API Backend Online",
      features: [
        "Audio Preprocessing",
        "ASR Translation Model",
        "Sentiment & Emotion Analysis",
        "VectorDB Integration"
      ],
      timestamp: new Date().toISOString()
    });
  });

  // --- ML Pipeline Equivalents (For Student Viva Architecture) ---

  // Pipeline Stage 1: Audio Preprocessing & Cleaning (Epic 4)
  app.post("/api/ml/pipeline/audio-preprocess", (req, res) => {
    setTimeout(() => {
      res.json({
        stage: "Audio Preprocessing",
        status: "success",
        metrics: {
          noiseReductionApplied: true,
          silenceRemovedSeconds: (Math.random() * 2).toFixed(2),
          segmentationCount: Math.floor(Math.random() * 8) + 3
        }
      });
    }, 600);
  });

  // Pipeline Stage 2: Speech-to-Text & Language Detection (Epic 5)
  app.post("/api/ml/pipeline/asr-transcribe", (req, res) => {
    setTimeout(() => {
      res.json({
        stage: "ASR",
        engine: "Hybrid Multilingual ASR",
        confidence: (Math.random() * 0.1 + 0.85).toFixed(2),
        status: "success"
      });
    }, 800);
  });

  // Pipeline Stage 3: Emotion & Sentiment Analysis (Epic 7)
  app.post("/api/ml/pipeline/sentiment-topic", (req, res) => {
    setTimeout(() => {
      res.json({
        stage: "NLP",
        engine: "Semantic Vector Analyzer",
        topicsDetected: Math.floor(Math.random() * 5) + 2,
        status: "success"
      });
    }, 500);
  });
  
  // Storage Pipeline: Vector DB (Epic 9)
  app.post("/api/ml/pipeline/vectorize", (req, res) => {
    setTimeout(() => {
      res.json({
        stage: "Vectorization",
        db: "ChromaDB-compatible Store",
        vectorsStored: Math.floor(Math.random() * 15) + 5,
        status: "success"
      });
    }, 400);
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
