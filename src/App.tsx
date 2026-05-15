import React, { useState, useEffect } from "react";
import { AudioUploader } from "./components/AudioUploader";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { AnalysisResult, ProcessingMode, Session, RAGDocument } from "./types";
import { processAudio, generateEmbeddings } from "./services/geminiService";
import { Waves, Database } from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";
import { getSessionsFromDB, saveSessionToDB } from "./db";

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 origin-left z-[100]"
      style={{ scaleX }}
    />
  );
};

export default function App() {
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("Speech");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalAudioData, setOriginalAudioData] = useState<{base64: string, mimeType: string} | null>(null);
  const [currentDocuments, setCurrentDocuments] = useState<RAGDocument[]>([]);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);

  // Persistence
  const [savedSessions, setSavedSessions] = useState<Session[]>([]);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const body = await res.json();
        setBackendStatus(body.message);
      }
    } catch (e) {
      console.warn("Backend not reachable", e);
    }
  };

  const loadSessions = async () => {
    try {
      const sessions = await getSessionsFromDB();
      // Sort newest first
      setSavedSessions(sessions.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const loadSessionContent = (session: Session) => {
    setResult(session.result);
    setProcessingMode(session.mode);
    setOriginalAudioData(session.audioData);
    setCurrentDocuments(session.documents || []);
    setIsSessionsOpen(false);
  };

  const handleAudioReady = async (base64Data: string, mimeType: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      setOriginalAudioData({ base64: base64Data, mimeType });
      
      // Simulate backend ML Pipeline
      setPipelineStage("Running Audio Preprocessing (Epic 4)...");
      await fetch("/api/ml/pipeline/audio-preprocess", { method: "POST" });
      
      setPipelineStage("Running Speech-to-Text & Lang Detection (Epic 5)...");
      await fetch("/api/ml/pipeline/asr-transcribe", { method: "POST" });
      
      setPipelineStage("Running Emotion & Sentiment Analysis (Epic 7)...");
      await fetch("/api/ml/pipeline/sentiment-topic", { method: "POST" });
      
      setPipelineStage("Generating Key Insights & Translation (RAG - Epic 10)...");
      const analysis = await processAudio(base64Data, mimeType, targetLanguage, processingMode);
      setResult(analysis);
      
      try {
        setPipelineStage("Storing Vectors to Database (Epic 9)...");
        await fetch("/api/ml/pipeline/vectorize", { method: "POST" });
        
        // Generate Embeddings for RAG
        const segments = analysis.transcriptSegments || [];
        const textsToEmbed = segments.map(s => s.text);
        
        let documents: RAGDocument[] = [];
        if (textsToEmbed.length > 0) {
          const embeddings = await generateEmbeddings(textsToEmbed);
          documents = segments.map((s, idx) => ({
            id: crypto.randomUUID(),
            text: s.speaker ? `${s.speaker}: ${s.text}` : s.text,
            embedding: embeddings[idx],
            metadata: {
              startTime: s.startTime,
              endTime: s.endTime,
            }
          }));
        }

        setCurrentDocuments(documents);

        // Save session
        const session: Session = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          title: `Session ${new Date().toLocaleTimeString()}`,
          mode: processingMode,
          audioData: { base64: base64Data, mimeType },
          result: analysis,
          documents
        };
        
        await saveSessionToDB(session);
        await loadSessions();

      } catch (dbErr) {
        console.error("Failed to save session or generate embeddings", dbErr);
      }

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to process audio.");
    } finally {
      setIsProcessing(false);
      setPipelineStage(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent selection:bg-sky-500 selection:text-white font-sans flex flex-col pt-6 px-6 overflow-x-hidden text-[#e0e0e6]">
      <ScrollProgress />
      <div className="atmosphere-bg"></div>
      {/* Header */}
      <header className="flex justify-between items-center mb-10 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tighter uppercase glow-text">
              FEEL THE VOICE
            </h1>
            <p className="text-[10px] mono text-sky-400 uppercase tracking-widest">Multilingual Speech Analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative">
            <button 
              onClick={() => setIsSessionsOpen(!isSessionsOpen)}
              className="text-[10px] font-semibold text-white/50 hover:text-white uppercase tracking-widest flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sessions ({savedSessions.length})</span>
            </button>
            
            <AnimatePresence>
              {isSessionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-64 glass-panel border border-white/10 rounded-lg shadow-2xl overflow-hidden z-40 bg-[#0f0f13]"
                >
                  <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">History</span>
                    <button onClick={() => setIsSessionsOpen(false)} className="text-white/30 hover:text-white text-xs">✕</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto w-full p-2 space-y-1">
                    {savedSessions.length === 0 ? (
                      <div className="text-xs text-white/40 text-center py-4">No sessions saved.</div>
                    ) : (
                      savedSessions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => loadSessionContent(s)}
                          className="w-full text-left p-2 rounded-md hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-sky-400">{s.title}</span>
                            <span className="text-[9px] mono opacity-40">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-[10px] opacity-60 flex gap-2 items-center">
                            <span className="capitalize">{s.mode} Mode</span>
                            <span>•</span>
                            <span className="truncate">{s.result.overallEmotion}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-widest hidden sm:inline-block">Mode:</span>
            <select
              value={processingMode}
              onChange={(e) => setProcessingMode(e.target.value as ProcessingMode)}
              className="bg-white/5 border border-white/10 text-[10px] rounded px-3 py-1.5 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors uppercase font-mono tracking-wider glass-panel"
              disabled={isProcessing}
            >
              <option value="Speech">Speech / Pitch</option>
              <option value="Meeting">Meeting / Sync</option>
              <option value="Lecture">Lecture / Class</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest hidden sm:inline-block">Target Lang:</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-white/5 border border-white/10 text-[10px] rounded px-3 py-1.5 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors uppercase font-mono tracking-wider glass-panel"
              disabled={isProcessing}
            >
              <option value="English">EN-US</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Mandarin">Mandarin</option>
              <option value="Japanese">Japanese</option>
              <option value="Hindi">Hindi</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Russian">Russian</option>
              <option value="Arabic">Arabic</option>
              <option value="Bengali">Bengali</option>
              <option value="Korean">Korean</option>
              <option value="Turkish">Turkish</option>
              <option value="Vietnamese">Vietnamese</option>
              <option value="Italian">Italian</option>
              <option value="Thai">Thai</option>
              <option value="Polish">Polish</option>
              <option value="Dutch">Dutch</option>
              <option value="Indonesian">Indonesian</option>
              <option value="Turkish">Turkish</option>
              <option value="Greek">Greek</option>
              <option value="Czech">Czech</option>
              <option value="Swedish">Swedish</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-[11px] mono opacity-60 uppercase">{isProcessing ? (pipelineStage || "PROCESSING_AUDIO") : "SYSTEM_ONLINE"}</span>
            {backendStatus && (
              <span className="text-[9px] mono text-emerald-400/80 ml-2 border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-500/10 hidden xl:inline-block">
                {backendStatus}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full 2xl:max-w-[1600px] mx-auto flex flex-col min-h-0">
        {!result && (
          <LandingPage 
            onAudioReady={handleAudioReady} 
            isProcessing={isProcessing} 
            error={error} 
          />
        )}

        {result && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full relative"
          >
            <div className="mb-8 flex justify-between items-center glass-panel p-4 rounded-xl border border-white/5 border-dashed">
             <div className="flex items-center gap-3">
               <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
               <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">Analysis Complete</span>
             </div>
             <button
               onClick={() => {
                 setResult(null);
                 setOriginalAudioData(null);
               }}
               className="text-[10px] font-semibold text-white/40 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded-md hover:bg-white/5"
             >
               Start New Analysis
             </button>
            </div>
            
            <Dashboard data={result} originalAudioData={originalAudioData} documents={currentDocuments} />
          </motion.div>
        )}
      </main>
    </div>
  );
}
