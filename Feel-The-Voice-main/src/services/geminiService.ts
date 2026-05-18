import { AnalysisResult, ProcessingMode } from "../types";

export async function processAudio(
  base64Audio: string,
  mimeType: string,
  targetLanguage: string = "English",
  mode: ProcessingMode = "Speech"
): Promise<AnalysisResult> {
  const response = await fetch('/api/ml/process-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Audio, mimeType, targetLanguage, mode })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to process audio via ML Pipeline.");
  }
  
  const result = await response.json();
  const parsed = result.data as AnalysisResult;
  parsed.mode = mode;
  return parsed;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch('/api/ml/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts })
  });
  
  if (!response.ok) {
     const errorData = await response.json().catch(() => null);
     throw new Error(errorData?.error || "Failed to generate embeddings.");
  }
  const result = await response.json();
  return result.embeddings;
}

export async function chatAboutAudio(
  base64Audio: string | null,
  mimeType: string | null,
  chatHistory: { role: "user" | "model", parts: { text: string }[] }[],
  newMessage: string,
  retrievedContext: string = ""
): Promise<string> {
    const response = await fetch('/api/ml/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Audio, mimeType, chatHistory, newMessage, retrievedContext })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to chat.");
    }
    const result = await response.json();
    return result.text;
}

export async function generateSpeechPlayback(
  textToSpeak: string
): Promise<string> {
    const response = await fetch('/api/ml/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textToSpeak })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to generate speech.");
    }
    const result = await response.json();
    return result.base64Audio;
}
