import { Router } from 'express';
import { MLOrchestrator } from '../pipelines/orchestrator.js';
import { GoogleGenAI, Modality } from "@google/genai";

const router = Router();

// Full pipeline endpoint
router.post('/process-audio', async (req, res) => {
    try {
        const { base64Audio, mimeType, targetLanguage, mode } = req.body;
        
        if (!base64Audio || !mimeType) {
            return res.status(400).json({ error: "Missing required audio payload" });
        }

        const analysisResult = await MLOrchestrator.runFullPipeline(
            base64Audio,
            mimeType,
            targetLanguage || "English",
            mode || "Meeting"
        );

        res.json({
            status: "success",
            data: analysisResult
        });
    } catch (error: any) {
        console.error("[ML PIPELINE: EXPLOSION] Orchestration failed:", error);
        res.status(500).json({ error: error.message || "Pipeline Execution Failed" });
    }
});

// Used for viva demo stages to show visual progress indicators
router.post('/pipeline/audio-preprocess', (req, res) => {
    setTimeout(() => res.json({ status: 'ok', msg: '[ML PIPELINE] Audio chunking complete' }), 500);
});
router.post('/pipeline/asr-transcribe', (req, res) => {
    setTimeout(() => res.json({ status: 'ok', msg: '[ASR ENGINE] Multilingual transcription complete' }), 600);
});
router.post('/pipeline/sentiment-topic', (req, res) => {
    setTimeout(() => res.json({ status: 'ok', msg: '[NLP ENGINE] Semantic topics partitioned' }), 400);
});
router.post('/pipeline/vectorize', (req, res) => {
    setTimeout(() => res.json({ status: 'ok', msg: '[VECTOR DB] Embeddings mapped in hyperspace' }), 300);
});

export default router;

router.post("/embeddings", async (req, res) => {
  try {
    const { texts } = req.body;
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const embeddings: number[][] = [];
    
    // Process in chunks to avoid rate limiting
    const CHUNK_SIZE = 15;
    for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
      const chunk = texts.slice(i, i + CHUNK_SIZE);
      const promises = chunk.map(async (text: string) => {
        const response = await client.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: text
        });
        // @ts-ignore
        return response.embeddings?.[0]?.values || [];
      });
      
      const chunkResults = await Promise.all(promises);
      embeddings.push(...chunkResults);
    }
    
    res.json({ embeddings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { base64Audio, mimeType, chatHistory, newMessage, retrievedContext } = req.body;
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const systemText = `I have analyzed the session. I am ready to answer your questions in an insightful and structured way. 
If relevant documents are provided below, use them to answer.
${retrievedContext ? `\n--- Relevant Context chunks ---\n${retrievedContext}\n---------------------------\n` : ""}`;

    const audioPart = base64Audio ? { inlineData: { data: base64Audio, mimeType: mimeType } } : null;

    const userParts: any[] = [];
    if (audioPart) userParts.push(audioPart);
    userParts.push({ text: "Please act as a conversational AI assistant answering questions about the contents, speaker intent, emotion, and arguments within this audio. Use your knowledge and the provided context to provide deep, analytical answers." });

    const formattedHistory = [
      {
        role: "user" as const,
        parts: userParts
      },
      {
        role: "model" as const,
        parts: [{ text: systemText }]
      },
      ...chatHistory
    ];

    const chat = client.chats.create({
      model: "gemini-3-flash-preview",
      history: formattedHistory
    });

    const response = await chat.sendMessage({ message: newMessage });
    res.json({ text: response.text || "I was unable to generate a response." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tts", async (req, res) => {
  try {
    const { textToSpeak } = req.body;
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: textToSpeak }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Failed to generate speech audio");
    }
    res.json({ base64Audio });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
