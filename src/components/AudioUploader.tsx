import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Mic, Square, Upload } from "lucide-react";
import { cn } from "../lib/utils";

interface AudioUploaderProps {
  onAudioReady: (base64Data: string, mimeType: string) => void;
  isLoading: boolean;
}

export function AudioUploader({ onAudioReady, isLoading }: AudioUploaderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const recordingStartTime = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        processBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      recordingStartTime.current = Date.now();
      setIsRecording(true);
      setMicError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setMicError("Could not access microphone. If you are in the editor preview, try opening the app in a new tab.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const duration = Date.now() - recordingStartTime.current;
      if (duration < 2500) {
        setMicError("Recording is too short! Please speak for at least a few seconds.");
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        return;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processBlob = (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Content = base64data.split(",")[1];
      onAudioReady(base64Content, blob.type);
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(",")[1];
        onAudioReady(base64Content, file.type);
      };
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 relative overflow-hidden isolate w-full max-w-md mx-auto">
      {/* Background wave animation when idle */}
      {!isRecording && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-20">
          <div className="w-32 h-32 rounded-full border border-sky-500/30 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full border border-indigo-500/20 animate-[ping_3s_infinite]" />
        </div>
      )}

      {/* Recording Pulse */}
      {isRecording && (
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/20 blur-[60px] -z-10 rounded-full" 
        />
      )}

      <div className="flex gap-4">
        <button
          onClick={() => {
            setMicError(null);
            isRecording ? stopRecording() : startRecording();
          }}
          disabled={isLoading}
          className={cn(
            "h-20 w-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-500 relative overflow-hidden",
            isRecording
              ? "bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] scale-105"
              : "bg-white/5 text-white hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/30 border border-white/10 hover:scale-105",
            isLoading && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          {isRecording ? (
            <Square className="h-8 w-8 fill-current" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>

        <div className="relative">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isLoading || isRecording}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <button
            disabled={isLoading || isRecording}
            className={cn(
              "h-20 w-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-500 bg-white/5 text-white border border-white/10",
              !isLoading && !isRecording && "hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 hover:scale-105",
              (isLoading || isRecording) && "opacity-50"
            )}
          >
            <Upload className="h-8 w-8" />
          </button>
        </div>
      </div>

      {micError && (
        <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-mono uppercase tracking-wider">
          {micError}
        </div>
      )}
    </div>
  );
}
