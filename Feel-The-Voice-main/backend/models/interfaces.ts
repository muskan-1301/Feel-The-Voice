export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  speaker: string;
  confidenceScore?: number;
}

export interface EmotionScore {
  label: string;
  intensity: number; // 0.0 to 1.0
  normValue?: number;
}

export interface TopicBoundary {
  topic: string;
  start_time: number;
  end_time: number;
  shift_probability?: number;
}

export interface EmbeddingMetadata {
  vectorId: string;
  dimensions: number;
  model: string;
  normalized: boolean;
}

export interface PipelineResult {
  status: string;
  processingTimeMs: number;
  metadata: {
    audioLength: number;
    language: string;
    chunksProcessed: number;
  };
  results: any; // Full AI analysis
}
