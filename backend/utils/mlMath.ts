export function generateConfidenceScore(base: number = 0.85): number {
  return Math.min(1.0, base + (Math.random() * 0.1));
}

export function normalizeEmbeddingVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / (magnitude || 1));
}

export function computeEmotionTimeline(segments: any[]): any[] {
  // Mock timeline generation based on segments
  return segments.map((s, i) => ({
    timestamp: s.start || i,
    intensity: Math.random() * 0.5 + 0.5,
    valence: Math.random() * 2 - 1,
  }));
}

export function calculateSemanticSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

export function cleanTranscript(text: string): string {
    // Mock cleaner
    return text.replace(/\\b(um|uh|like|you know)\\b/gi, '').trim();
}

export function detectTopicShift(probability: number): boolean {
    return probability > 0.75;
}
