export type ProcessingMode = "Lecture" | "Meeting" | "Speech";

export interface TranscriptSegment {
  startTime?: number; // Start time in seconds
  endTime?: number;   // End time in seconds
  timestamp?: string; // e.g., "[00:00 - 00:05]"
  text: string;
  speaker?: string; // e.g. "Speaker A"
}

export interface SpeakerStat {
  name: string;
  totalTimeSeconds: number;
  percentage: number;
  turns: number;
  dominantEmotion?: string;
}

export interface InteractionInsight {
  text: string; // e.g. "Speaker A interrupted Speaker B 3 times"
  type: "interruption" | "dominance" | "back-and-forth";
}

export interface Insight {
  text: string;
  emotion: string;
  confidence: number;
  importance: "low" | "medium" | "high";
}

export interface Topic {
  topic: string; // the name
  relevance: number; // 0 to 1
}

export interface EmotionPoint {
  time: string; // e.g., "0:05", "0:10"
  emotion: string; 
  intensity: number; // 0 to 1
}

export interface AnalysisResult {
  mode: ProcessingMode;
  transcriptSegments?: TranscriptSegment[];
  translatedTranscriptSegments?: TranscriptSegment[];
  transcript: string;
  translatedTranscript: string;
  detectedLanguage: string;
  overallEmotion: string;
  keyInsights: Insight[];
  topics: Topic[];
  emotionsTimeline: EmotionPoint[];
  speakerStats?: SpeakerStat[];
  interactionInsights?: InteractionInsight[];
}

export interface RAGDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    startTime?: number;
    endTime?: number;
  };
}

export interface Session {
  id: string;
  timestamp: number;
  title: string;
  mode: ProcessingMode;
  audioData: {
    base64: string;
    mimeType: string;
  };
  result: AnalysisResult;
  documents: RAGDocument[]; // Embedded chunks
}
