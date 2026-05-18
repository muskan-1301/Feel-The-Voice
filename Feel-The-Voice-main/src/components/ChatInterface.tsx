import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { chatAboutAudio, generateEmbeddings } from "../services/geminiService";
import { RAGDocument } from "../types";
import { dotProduct } from "../db";

export function ChatInterface({ 
  originalAudioData,
  documents
}: { 
  originalAudioData: { base64: string, mimeType: string } | null;
  documents?: RAGDocument[];
}) {
  const [messages, setMessages] = useState<{ role: "user" | "model", text: string }[]>([
    { role: "model", text: "Hello! I've analyzed the audio. What would you like to know about it? You can ask about key decisions, emotional turning points, or specific arguments." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !originalAudioData || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user" as const, text: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Find relevant context
      let retrievedContext = "";
      if (documents && documents.length > 0) {
        setMessages(prev => [...prev, { role: "model", text: "Searching knowledge base..." }]);
        const qEmbeddings = await generateEmbeddings([userMessage]);
        const qVec = qEmbeddings[0];
        
        const scoredDocs = documents.map(doc => ({
          ...doc,
          score: dotProduct(doc.embedding, qVec)
        })).sort((a, b) => b.score - a.score);

        const topDocs = scoredDocs.slice(0, 3);
        retrievedContext = topDocs.map(d => `[${d.metadata.startTime}s - ${d.metadata.endTime}s]: ${d.text}`).join('\n');
        
        // Remove the temporary searching message
        setMessages(prev => prev.slice(0, -1));
      }

      // Format history for the API - skip the first greeting message
      const chatHistory = newMessages.slice(1, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const reply = await chatAboutAudio(
        originalAudioData.base64,
        originalAudioData.mimeType,
        chatHistory,
        userMessage,
        retrievedContext
      );

      setMessages(prev => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "model", text: "Sorry, I encountered an error answering your question." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!originalAudioData) return null;

  return (
    <div className="flex flex-col h-full min-h-[500px] glass-panel rounded-xl overflow-hidden border border-white/10 relative shadow-2xl">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 px-5 py-4 flex items-center gap-3">
        <Bot className="w-5 h-5 text-sky-400" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-sky-400">Audio Assistant (Conversational RAG)</h3>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-6 font-sans text-sm scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-amber-500/20 text-amber-400" : "bg-sky-500/20 text-sky-400"}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] p-4 rounded-xl leading-relaxed text-white/90 shadow-sm ${msg.role === "user" ? "bg-amber-500/10 border border-amber-500/20 rounded-tr-none" : "bg-white/5 border border-white/10 rounded-tl-none"}`}>
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-sky-500/20 text-sky-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="max-w-[85%] p-4 rounded-xl leading-relaxed bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400/70" />
              <span className="text-sm text-white/50 mono">Analyzing context...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 border-t border-white/10">
        <div className="flex items-center gap-3 relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question about the speech..."
            disabled={isTyping}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-base text-white focus:outline-none focus:border-sky-500 transition-colors disabled:opacity-50 shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-sky-600 hover:bg-sky-500 text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
