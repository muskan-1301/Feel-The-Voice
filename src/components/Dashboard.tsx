import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Play, Pause, Languages, Sparkles, MessageSquare, Activity } from "lucide-react";
import { AnalysisResult, RAGDocument } from "../types";
import { generateSpeechPlayback } from "../services/geminiService";
import { ChatInterface } from "./ChatInterface";

export function Dashboard({ 
  data, 
  originalAudioData,
  documents
}: { 
  data: AnalysisResult;
  originalAudioData?: { base64: string, mimeType: string } | null;
  documents?: RAGDocument[];
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [playingSource, setPlayingSource] = useState<AudioBufferSourceNode | null>(null);

  const [isOriginalPlaying, setIsOriginalPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (originalAudioData && !originalAudioRef.current) {
      const audioUrl = `data:${originalAudioData.mimeType};base64,${originalAudioData.base64}`;
      const audio = new Audio(audioUrl);
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const onEnded = () => setIsOriginalPlaying(false);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', onEnded);
      originalAudioRef.current = audio;

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', onEnded);
        audio.pause();
        originalAudioRef.current = null;
      };
    }
  }, [originalAudioData]);

  const handlePlayOriginal = () => {
    if (isOriginalPlaying && originalAudioRef.current) {
      originalAudioRef.current.pause();
      setIsOriginalPlaying(false);
    } else if (originalAudioRef.current) {
      originalAudioRef.current.play();
      setIsOriginalPlaying(true);
    }
  };

  const chartData = data.emotionsTimeline.map((item) => ({
    time: item.time,
    intensity: item.intensity * 100,
    emotion: item.emotion,
  }));

  const handlePlayVoice = async () => {
    if (isPlaying && playingSource) {
      playingSource.stop();
      setIsPlaying(false);
      setPlayingSource(null);
      return;
    }

    try {
      setIsGeneratingAudio(true);
      
      const base64Audio = await generateSpeechPlayback(data.translatedTranscript);
      
      // Decode base64 to ArrayBuffer
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create audio context (sample rate is 24000 as per Gemini TTS docs)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Gemini TTS returns 16-bit PCM. We need to convert it to Float32 for Web Audio API
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      
      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setPlayingSource(null);
      };
      
      setPlayingSource(source);
      source.start();
      setIsPlaying(true);
    } catch (err) {
      console.error("Failed to play audio:", err);
      alert("Failed to generate or play speech audio.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 lg:gap-8 w-full 2xl:max-w-[1600px] mx-auto pb-12">
      {/* Transcriptions Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 lg:p-8 flex flex-col relative w-full shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 flex-1">
            {/* Original Transcript */}
            <div className="space-y-6">
              <h2 className="text-xs font-semibold uppercase opacity-50 mb-4 tracking-widest flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  Original Transcript
                </div>
                {originalAudioData && (
                  <button
                    onClick={handlePlayOriginal}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md flex items-center gap-2 transition-colors text-[11px] text-emerald-400 uppercase font-semibold"
                  >
                    {isOriginalPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {isOriginalPlaying ? "Pause" : "Play Original"}
                  </button>
                )}
              </h2>
              {data.transcriptSegments && data.transcriptSegments.length > 0 ? (
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 relative">
                  {data.transcriptSegments.map((segment, idx) => {
                    const formatTime = (secs?: number) => {
                      if (secs === undefined) return "[00:00]";
                      const m = Math.floor(secs / 60).toString().padStart(2, '0');
                      const s = Math.floor(secs % 60).toString().padStart(2, '0');
                      return `[${m}:${s}]`;
                    };
                    const timeLabel = segment.timestamp || formatTime(segment.startTime);
                    
                    const isCurrent = segment.startTime !== undefined && segment.endTime !== undefined 
                      ? (currentTime >= segment.startTime && currentTime <= segment.endTime)
                      : false;

                    return (
                      <div key={idx} className={`flex gap-4 transition-colors duration-300 ${isCurrent ? 'border-l-2 border-emerald-500/50 pl-4 bg-emerald-500/5' : ''}`}>
                        <div className="shrink-0 flex flex-col items-start gap-1">
                          <span className={`mono text-xs mt-1 ${isCurrent ? 'text-emerald-400' : 'opacity-50'}`}>{timeLabel}</span>
                          {segment.speaker && (
                             <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded bg-white/10 text-white/80 border border-white/5">
                               {segment.speaker}
                             </span>
                          )}
                        </div>
                        <p className={`text-xl font-light leading-relaxed ${isCurrent ? 'text-white font-normal' : 'text-white/80'}`}>
                          {segment.text}
                          {isCurrent && <span className="inline-block w-1.5 h-5 bg-emerald-500 ml-1 align-middle animate-pulse"></span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-5">
                  <span className="mono text-xs mt-1 opacity-50 shrink-0">[SRC]</span>
                  <p className="text-xl font-light leading-relaxed text-white/80">
                    {data.transcript}
                  </p>
                </div>
              )}
            </div>

            {/* Translated Transcript */}
            <div className="space-y-6 border-l-0 lg:border-l border-t lg:border-t-0 pt-6 lg:pt-0 lg:pl-12 border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Languages className="w-40 h-40" />
              </div>
              <h2 className="text-xs font-semibold uppercase opacity-50 mb-4 tracking-widest flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-sky-400" />
                  <span>Translated ({data.detectedLanguage !== 'English' ? 'EN' : 'Target'})</span>
                </div>
                
                <button
                  onClick={handlePlayVoice}
                  disabled={isGeneratingAudio}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 text-[11px] text-sky-400 font-semibold uppercase"
                >
                  {isGeneratingAudio ? (
                    <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  {isPlaying ? "Pause" : "TTS Out"}
                </button>
              </h2>
              {data.translatedTranscriptSegments && data.translatedTranscriptSegments.length > 0 ? (
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4">
                  {data.translatedTranscriptSegments.map((segment, idx) => {
                    const formatTime = (secs?: number) => {
                      if (secs === undefined) return "[00:00]";
                      const m = Math.floor(secs / 60).toString().padStart(2, '0');
                      const s = Math.floor(secs % 60).toString().padStart(2, '0');
                      return `[${m}:${s}]`;
                    };
                    const timeLabel = segment.timestamp || formatTime(segment.startTime);
                    
                    return (
                      <div key={idx} className="flex gap-5">
                        <span className="mono text-xs mt-1 opacity-50 text-sky-400 shrink-0">{timeLabel}</span>
                        <p className="text-xl font-light leading-relaxed text-sky-50">
                          {segment.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-5">
                  <span className="mono text-xs mt-1 opacity-50 text-sky-400 shrink-0">[OUT]</span>
                  <p className="text-xl font-light leading-relaxed text-sky-50">
                    {data.translatedTranscript}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-white/10 flex gap-4 text-xs font-mono text-white/50 uppercase items-center">
            <span className="px-3 py-1 border border-white/10 rounded bg-white/5">Detected Lang: <span className="text-white font-semibold">{data.detectedLanguage}</span></span>
            <span className="px-3 py-1 border border-white/10 rounded bg-white/5">Overall Emotion: <span className="text-white font-semibold">{data.overallEmotion}</span></span>
          </div>
        </motion.div>

        {/* Emotion Timeline Graph - Full Width now */}
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           whileInView={{ y: 0, opacity: 1 }}
           viewport={{ once: true, amount: 0.1 }}
           transition={{ delay: 0.3 }}
           className="glass-panel p-6 lg:p-8 h-[350px] flex flex-col shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase opacity-50 tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Emotion Timeline
            </h2>
            <div className="text-xs font-mono text-sky-400/70 uppercase">Intensity / Segment</div>
          </div>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'rgba(5,5,7,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#38bdf8' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '12px' }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(0)}% (${props.payload.emotion})`,
                    'Intensity'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="#38bdf8" 
                  strokeWidth={3}
                  dot={{ fill: '#050507', stroke: '#38bdf8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#fff', stroke: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      {/* Sections below graph: Analytics, Insights, Chat */}
      <div className="flex flex-col gap-6 lg:gap-8">
        
        {/* Row 1: Speaker Analytics & Semantic Topics */}
        <div className="flex flex-col gap-6 lg:gap-8">
            {/* Speaker Analytics */}
            {data.speakerStats && data.speakerStats.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: 0.35 }}
                className="glass-panel p-5 flex-1 flex flex-col"
              >
                <h2 className="text-xs font-semibold uppercase opacity-50 mb-5 tracking-widest flex items-center gap-2 shrink-0">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Speaker Analytics
                </h2>
                <div className="space-y-6">
                   {data.speakerStats.map((stat, idx) => {
                      const relevancePercentage = (stat.percentage).toFixed(0);
                      const colorClass = idx % 3 === 0 ? "bg-sky-500" : idx % 3 === 1 ? "bg-emerald-500" : "bg-amber-500";
                      const textColorClass = idx % 3 === 0 ? "text-sky-400" : idx % 3 === 1 ? "text-emerald-400" : "text-amber-400";
                      
                      return (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-semibold uppercase ${textColorClass}`}>{stat.name}</span>
                            <span className="mono text-xs opacity-70 flex gap-2">
                              <span>{stat.turns} Turns</span>
                              <span>•</span>
                              <span>{relevancePercentage}%</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${relevancePercentage}%` }}
                              transition={{ delay: 0.8 + idx * 0.1, duration: 1, ease: 'easeOut' }}
                              className={`h-full ${colorClass}`} 
                            />
                          </div>
                          <div className="flex gap-3 text-xs uppercase tracking-wider text-white/50">
                            <span>Time: {Math.floor(stat.totalTimeSeconds / 60)}m {Math.floor(stat.totalTimeSeconds % 60)}s</span>
                            {stat.dominantEmotion && (
                              <>
                                <span>•</span>
                                <span>Mood: {stat.dominantEmotion}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                   })}
                </div>
              </motion.div>
            )}

            {/* Semantic Topics */}
            {data.topics && data.topics.length > 0 && (
              <motion.div
                 initial={{ y: 20, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 viewport={{ once: true, amount: 0.1 }}
                 transition={{ delay: 0.4 }}
                 className="glass-panel p-5 lg:p-6 flex-1 flex flex-col"
              >
                <h2 className="text-xs font-semibold uppercase opacity-50 mb-5 tracking-widest flex items-center gap-2 shrink-0">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Semantic Topics
                </h2>
                <div className="space-y-6">
                   {data.topics.map((topic, idx) => {
                      const relevancePercentage = (topic.relevance * 100).toFixed(0);
                      const colorClass = idx % 2 === 0 ? "bg-emerald-500" : "bg-sky-500";
                      const textColorClass = idx % 2 === 0 ? "text-emerald-400" : "text-sky-400";
                      
                      return (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-semibold uppercase ${textColorClass}`}>{topic.topic}</span>
                            <span className="mono text-xs opacity-70">{relevancePercentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${relevancePercentage}%` }}
                              transition={{ delay: 0.8 + idx * 0.1, duration: 1, ease: 'easeOut' }}
                              className={`h-full ${colorClass}`} 
                            />
                          </div>
                        </div>
                      );
                   })}
                </div>
              </motion.div>
            )}

        </div>

        {/* Row 2: Interaction & Generated Insights */}
        <div className="flex flex-col gap-6 lg:gap-8">
            {/* Interaction Insights */}
            {data.interactionInsights && data.interactionInsights.length > 0 && (
               <motion.div
                 initial={{ y: 20, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 viewport={{ once: true, amount: 0.1 }}
                 transition={{ delay: 0.38 }}
                 className="glass-panel p-5 lg:p-6 flex-1 flex flex-col"
               >
                 <h2 className="text-xs font-semibold uppercase opacity-50 mb-5 tracking-widest flex items-center gap-2 shrink-0">
                   <MessageSquare className="w-4 h-4 text-indigo-400" />
                   Interactions
                 </h2>
                 <div className="space-y-5">
                   {data.interactionInsights.map((insight, idx) => (
                     <div key={idx} className="flex items-start gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                       <span className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${insight.type === 'interruption' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'}`} />
                       <p className="text-[15px] text-white/90 leading-relaxed font-light">{insight.text}</p>
                     </div>
                   ))}
                 </div>
               </motion.div>
            )}
    
            {/* Generated Insights */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: 0.5 }}
              className="glass-panel p-5 lg:p-6 flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-5 shrink-0">
                <h2 className="text-xs font-semibold uppercase opacity-50 tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Generated Insights
                </h2>
                <span className="text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-md border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">RAG Ready</span>
              </div>
    
              <div className="flex-1 space-y-5">
                {data.keyInsights.map((insight, idx) => {
                    return (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                          <h3 className="text-sm font-bold text-sky-400 uppercase tracking-widest">
                            Emotion: {insight.emotion}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20 uppercase font-semibold">
                              {(insight.confidence * 100).toFixed(0)}%
                            </span>
                            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 text-xs font-mono border border-amber-500/20 uppercase font-semibold">
                              {insight.importance}
                            </span>
                          </div>
                        </div>
                        <p className="text-[15px] font-light leading-relaxed text-white/90">{insight.text}</p>
                      </motion.div>
                    );
                })}
              </div>
            </motion.div>
        </div>

        {/* Row 3: Chat Interface */}
        <div className="flex flex-col w-full h-[600px]">
            <motion.div
               initial={{ y: 20, opacity: 0 }}
               whileInView={{ y: 0, opacity: 1 }}
               viewport={{ once: true, amount: 0.1 }}
               transition={{ delay: 0.6 }}
               className="h-full w-full"
            >
              <ChatInterface originalAudioData={originalAudioData || null} documents={documents} />
            </motion.div>
        </div>

      </div>
    </div>
  );
}
