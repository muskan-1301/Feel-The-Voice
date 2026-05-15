import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AudioUploader } from "./AudioUploader";
import { Mic, Activity, Zap, Layers, Globe, Sparkles, ChevronRight, Shield, Database } from "lucide-react";

interface LandingPageProps {
  onAudioReady: (base64Data: string, mimeType: string) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
}

const LiquidMic = () => {
  return (
    <motion.div
      animate={{ y: [-15, 15, -15] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-40 h-40 flex items-center justify-center mx-auto mb-4 mt-4"
    >
      {/* Main Aura Glow */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-[-50%] bg-cyan-400/30 rounded-full blur-[50px] mix-blend-screen"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3], rotate: 360 }}
        transition={{ scale: {duration: 2.5, repeat: Infinity, ease: "easeInOut"}, rotate: {duration: 8, repeat: Infinity, ease: "linear"} }}
        className="absolute inset-[-20%] bg-indigo-500/40 rounded-full blur-[40px] mix-blend-screen"
      />

      {/* Colorful shifting rings */}
      <motion.div
        animate={{ rotate: 360, scale: [0.95, 1.05, 0.95] }}
        transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute inset-0 rounded-full blur-[6px] opacity-90"
        style={{ background: 'conic-gradient(from 0deg, #4ade80, #38bdf8, #818cf8, #c084fc, #38bdf8, #4ade80)' }}
      />
      <motion.div
        animate={{ rotate: -360, scale: [1.05, 0.95, 1.05] }}
        transition={{ rotate: { duration: 5, repeat: Infinity, ease: "linear" }, scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute inset-2 rounded-full blur-[8px] opacity-80 mix-blend-overlay"
        style={{ background: 'conic-gradient(from 180deg, #c084fc, #e879f9, #38bdf8, #4ade80, #c084fc)' }}
      />

      {/* Solid bright center */}
      <motion.div
        animate={{ scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-3 bg-white rounded-full shadow-[0_0_60px_rgba(255,255,255,1)] flex items-center justify-center z-10"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-sky-50 shadow-[inset_0_-10px_20px_rgba(56,189,248,0.15)]" />
        <Mic className="w-10 h-10 text-sky-900 drop-shadow-sm relative z-10" strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
};

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-sky-400/30 rounded-full"
          animate={{
            x: [Math.random() * 100 + "vw", Math.random() * 100 + "vw"],
            y: [Math.random() * 100 + "vh", Math.random() * 100 + "vh"],
            opacity: [0, 0.5, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export function LandingPage({ onAudioReady, isProcessing, error }: LandingPageProps) {
  const [loadingPhase, setLoadingPhase] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setLoadingPhase((p) => (p + 1) % 4);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  const loadingText = [
    "Initializing multilingual engine...",
    "Transcribing & translating audio...",
    "Extracting semantic features & emotion...",
    "Synthesizing actionable intelligence..."
  ];

  return (
    <div className="relative font-sans text-white min-h-screen overflow-x-hidden pt-20 pb-32 bg-[#030303]">
      {/* Background Pattern - Optimized */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 hero-grid opacity-30"></div>
        <FloatingParticles />
        {/* Simplified ambient glows without heavy blur sizes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sky-600/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* AI Centerpiece */}
        <LiquidMic />

        <div className="flex flex-col items-center justify-center text-center max-w-4xl pt-4 mx-auto mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tighter mb-6 leading-[0.95]"
          >
            Feel The
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/30">
              Voice.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-sm"
          >
            Enterprise-grade speech analysis. Transcribe, translate, and extract deep emotional intelligence from any audio source in milliseconds.
          </motion.p>
        </div>

        {/* Action & Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col gap-12"
        >
          {/* Main Action Card - NOW CENTERED */}
          <div className="w-full max-w-4xl mx-auto relative group p-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-[2rem] shadow-2xl">
            <div className="relative h-full glass-panel p-8 md:p-16 rounded-[2rem] bg-[#09090b]/80 backdrop-blur-xl overflow-hidden pointer-events-auto flex flex-col items-center justify-center text-center">
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <h2 className="text-[10px] font-mono text-sky-400 uppercase tracking-[0.4em] mb-4">
                  Ready for analysis
                </h2>
                <h3 className="text-4xl font-bold tracking-tight text-white">Input Audio</h3>
              </motion.div>
              
              <div className="relative z-10 w-full max-w-md flex justify-center">
                <AudioUploader onAudioReady={onAudioReady} isLoading={isProcessing} />
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] text-left font-mono uppercase tracking-widest relative z-10 shadow-[0_0_20px_rgba(239,68,68,0.1)] w-full max-w-md"
                  >
                    {error}
                  </motion.div>
                )}
                
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: 20 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 20 }}
                    className="mt-8 bg-white/5 p-6 rounded-2xl border border-white/5 relative z-10 shadow-inner backdrop-blur-xl w-full max-w-md"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[10px] text-white font-mono uppercase tracking-widest h-4 overflow-hidden relative w-full text-left">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={loadingPhase}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0"
                          >
                            {loadingText[loadingPhase]}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative shadow-inner">
                      <motion.div 
                        initial={{ left: "-20%", width: "20%" }}
                        animate={{ left: "100%", width: "20%" }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                        className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent via-sky-400 to-transparent rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Side Bento Row - NOW HORIZONTAL & ALIGNED WITH ABOVE CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto w-full mt-12"
        >
            <BentoCard 
              icon={<Globe className="w-5 h-5 text-sky-400" />}
              title="Cross-Lingual Engine"
              description="Automatic language detection and translation."
            />
            <BentoCard 
              icon={<Activity className="w-5 h-5 text-emerald-400" />}
              title="Emotion Radar"
              description="Temporal tracking of voice prosody mapping."
            />
            <BentoCard 
              icon={<Zap className="w-5 h-5 text-amber-400" />}
              title="Speaker Diarization"
              description="Identify 'who spoke when' accurately."
            />
            <BentoCard 
              icon={<Shield className="w-5 h-5 text-pink-400" />}
              title="Privacy Preserved"
              description="Processed with edge-grade security."
            />
        </motion.div>

        {/* --- NEW SCROLLABLE SECTIONS --- */}

        {/* Features Slide 1: Capability Overview */}
        <div className="mt-48 grid grid-cols-1 lg:grid-cols-1 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono text-sky-400 uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" />
              Advanced Capability
            </div>
            <h2 className="text-5xl sm:text-7xl font-bold mb-8 tracking-tight">The Future of <span className="text-sky-400">Audio Intelligence</span>.</h2>
            <p className="text-white/60 text-xl leading-relaxed mb-12">
              Our proprietary neural architecture processes acoustic signals to identify not just the words spoken, but the intent, sentiment, and biological markers of emotion behind every syllable.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Globe className="w-5 h-5" />, text: "Global Translation Suite", desc: "100+ dialects supported" },
                { icon: <Zap className="w-5 h-5" />, text: "Neural Low Latency", desc: "Sub-2s processing" },
                { icon: <Database className="w-5 h-5" />, text: "Vector History", desc: "Deep memory retrieval" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{item.text}</div>
                    <div className="text-xs text-white/40">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Features Slide 2: Process Steps */}
        <div className="mt-64 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-24"
          >
            Three Steps to <span className="text-emerald-400">Deep Insight</span>.
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Ingestion", desc: "Upload raw audio or record live sessions directly in your browser with high fidelity.", icon: <Mic className="w-6 h-6" /> },
              { step: "02", title: "Analysis", desc: "Our neural engines slice the audio into phonemes, detecting language, speaker IDs, and emotional peaks.", icon: <Zap className="w-6 h-6" /> },
              { step: "03", title: "Extraction", desc: "Receive a full dossier including translated transcripts, emotion charts, and AI-driven summaries.", icon: <Layers className="w-6 h-6" /> }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors group"
              >
                <div className="absolute -top-6 left-8 text-6xl font-black text-white/5 group-hover:text-sky-500/10 transition-colors">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                  <div className="text-sky-400">{item.icon}</div>
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Slide 3: Global Impact */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-64 p-12 md:p-24 rounded-[3rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 relative overflow-hidden text-center"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.15),transparent)] pointer-events-none"></div>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight max-w-4xl mx-auto">Analyze global conversations with <span className="italic font-light">unprecedented</span> clarity.</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-12">
            Whether it's a corporate meeting, a lecture, or a public speech, Feel The Voice bridges the gap between sound and meaning.
          </p>
          <div className="flex flex-wrap justify-center gap-12 mt-16">
            {[
              { val: "100+", label: "Languages" },
              { val: "< 2s", label: "Analysis Time" },
              { val: "10k+", label: "Insights Daily" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.val}</div>
                <div className="text-[10px] font-mono text-sky-400 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BentoCard({ icon, title, description, className = "" }: { icon: React.ReactNode, title: string, description: string, className?: string }) {
  return (
    <div className={`group relative p-6 rounded-3xl bg-[#0e0e12]/80 border border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 flex lg:flex-row flex-col items-start lg:items-center gap-4 h-full">
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-colors shadow-inner">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-1 tracking-tight">{title}</h3>
          <p className="text-xs text-white/50 leading-relaxed font-light">{description}</p>
        </div>
      </div>
    </div>
  );
}
