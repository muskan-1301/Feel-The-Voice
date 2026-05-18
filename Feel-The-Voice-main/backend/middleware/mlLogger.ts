import { Request, Response, NextFunction } from 'express';

export function mlPipelineLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  console.log(`\\n[ML ORCHESTRATOR] Received ${req.method} request at ${req.url}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[ML ORCHESTRATOR] Completed ${req.url} with status ${res.statusCode} in ${duration}ms\\n`);
  });
  
  next();
}

export function validateAudioMetadata(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'POST' && req.body && req.body.base64Audio) {
       console.log(`[ML ORCHESTRATOR] Validating metadata: ${req.body.mimeType || 'unknown format'} | Length: ${req.body.base64Audio.length}`);
       if (req.body.base64Audio.length < 100) {
           return res.status(400).json({ error: "Audio payload too small or corrupted" });
       }
    }
    next();
}
