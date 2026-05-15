import { PreprocessService } from '../services/preprocessService.js';
import { ASRService } from '../services/asrService.js';
import { EmotionService } from '../services/emotionService.js';
import { VectorService } from '../services/vectorService.js';
import { RAGService } from '../services/ragService.js';
import { GoogleGenAI, Type } from "@google/genai";

const PRIMARY_MODEL = process.env.NEURAL_MODEL_PRIMARY || "gemini-2.5-flash";

/*
  ==============================================================
  [ARCHITECTURE NOTE - ML MICROSERVICES MIGRATION]
  Current Architecture: Node.js Orchestration Layer (Monolith)
  Future Architecture: Python ML Microservices
  
  React Frontend
   -> Node.js Express (Orchestrator)
        -> Python/FastAPI (Audio Preprocessing & VAD)
        -> Python/FastAPI (Whisper / SenseVoice ASR)
        -> Python/FastAPI (Semantic Analyzer & NLP)
        -> ChromaDB (Vector Search / RAG)
  ==============================================================
*/

export class MLOrchestrator {
  public static async runFullPipeline(audioBase64: string, mimeType: string, targetLanguage: string, processingMode: string) {
    try {
      // 1. PREPROCESSING
      await PreprocessService.execute(audioBase64, mimeType);
      
      // 2. ASR & LANGUAGE DETECTION
      await ASRService.transcribe(audioBase64, mimeType);
      
      // 3. NLP & EMOTION ANALYSIS (Mock Prep)
      EmotionService.analyze("pending_transcript...");
      
      // 4. VECTORIZATION
      VectorService.embed({ status: "processing" });
      
      // 5. RAG CONTEXT BUILDING
      RAGService.prepareContext();
      
      // 6. FINAL INSIGHT GENERATION (LLM INFERENCE)
      console.log("[ML PIPELINE: INFERENCE] Delegating heavy NLP extraction to Primary Neural Foundation Model...");
      const result = await this.callFoundationModel(audioBase64, mimeType, targetLanguage, processingMode);
      
      console.log("[ML PIPELINE: ORCHESTRATOR] Final insights generated successfully.");
      return result;
    } catch (e) {
      console.error("[ML PIPELINE: ERROR] Failed pipeline execution:", e);
      throw e;
    }
  }

  // --- INTERNAL INFERENCE WRAPPER ---
  private static async callFoundationModel(base64Audio: string, mimeType: string, targetLanguage: string, mode: string) {
      const client = new GoogleGenAI({ apiKey: process.env.NEURAL_API_KEY });
    
    let modeInstructions = "";
    if (mode === "Lecture") {
      modeInstructions = "Focus your insights on key educational concepts, definitions, and theories mentioned.";
    } else if (mode === "Meeting") {
      modeInstructions = "Focus your insights on actionable items, decisions made, and follow-ups assigned.";
    } else if (mode === "Speech") {
      modeInstructions = "Focus your insights on emotional turning points, persuasion tactics, and the main arguments.";
    }

    const systemInstruction = `You are a sophisticated Neural Speech Analysis Engine working in ${mode} mode.
You process audio and extract detailed structured insights. You must also act as a Speaker Intelligence System.

CRITICAL INSTRUCTION: If the requested audio contains mostly silence, background noise, or no discernible human speech, you MUST return an empty transcript, empty arrays for insights, topics, and speakerStats, and set overallEmotion to 'No Speech Detected'. DO NOT hallucinate speech.

Perform the following tasks:
1. Transcribe the audio precisely. Also provide the transcript broken down into short sentences or phrases with their estimated start and end timestamps in seconds, AND identify the speaker (e.g. "Speaker A", "Speaker B").
2. Detect the source language.
3. Translate the transcript into the requested target language (${targetLanguage}). Include timestamps and speaker labels.
4. Determine the overall emotion.
5. Create a timeline of emotions at roughly 5-10 second intervals or at logical breaks.
6. Extract 3 to 5 key insights from the speech based on the current mode. ${modeInstructions}
7. Identify main semantic topics and their relevance (0.0 to 1.0).
8. Speaker Analytics: Calculate each speaker's total speaking time, contribution percentage, total turns, and their dominant emotion.
9. Interaction Analysis: Identify key interactions (e.g., interruptions, rapid back-and-forth, dominance).
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        transcript: { type: Type.STRING },
        transcriptSegments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              startTime: { type: Type.NUMBER, description: "Start time in seconds" },
              endTime: { type: Type.NUMBER, description: "End time in seconds" },
              speaker: { type: Type.STRING },
            },
          },
        },
        translatedTranscript: { type: Type.STRING },
        translatedTranscriptSegments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              startTime: { type: Type.NUMBER, description: "Start time in seconds" },
              endTime: { type: Type.NUMBER, description: "End time in seconds" },
              speaker: { type: Type.STRING },
            },
          },
        },
        detectedLanguage: { type: Type.STRING },
        overallEmotion: { type: Type.STRING },
        keyInsights: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              emotion: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              importance: { type: Type.STRING },
            },
          },
        },
        emotionsTimeline: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING, description: "Time marker, e.g. '0:05' or 'Segment 1'" },
              emotion: { type: Type.STRING },
              intensity: { type: Type.NUMBER },
            },
          },
        },
        topics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              relevance: { type: Type.NUMBER },
            },
          },
        },
        speakerStats: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              totalTimeSeconds: { type: Type.NUMBER },
              percentage: { type: Type.NUMBER },
              turns: { type: Type.NUMBER },
              dominantEmotion: { type: Type.STRING },
            },
          },
        },
        interactionInsights: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, description: "'interruption' | 'dominance' | 'back-and-forth'" },
            },
          },
        },
      },
    };

    const response = await client.models.generateContent({
      model: PRIMARY_MODEL,
      contents: [
        {
          parts: [
            { inlineData: { data: base64Audio, mimeType } },
            { text: "Analyze this speech audio." }
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response from model.");
    }
    
    let textToParse = text.trim();
    if (textToParse.startsWith('```')) {
      textToParse = textToParse.replace(/^```(?:json)?\n/i, '').replace(/\n```$/i, '');
    }
    
    return JSON.parse(textToParse);
  }
}
