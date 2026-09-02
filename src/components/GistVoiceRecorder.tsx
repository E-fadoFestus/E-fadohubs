import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';

interface GistVoiceRecorderProps {
  onSendVoiceNote: (audioUrl: string, durationSec: number) => void;
  onCancel: () => void;
}

export const GistVoiceRecorder: React.FC<GistVoiceRecorderProps> = ({ onSendVoiceNote, onCancel }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [simulatedAudioUrl, setSimulatedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStopRecording = () => {
    setIsRecording(false);
    // Standard test audio sound or synthesized waveform
    setSimulatedAudioUrl('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3');
  };

  const handleSend = () => {
    onSendVoiceNote(
      simulatedAudioUrl || 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3',
      Math.max(1, seconds)
    );
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-purple-950/80 border border-purple-500/40 px-4 py-2.5 rounded-2xl w-full text-white backdrop-blur-md shadow-lg animate-in fade-in duration-200">
      {/* Recording indicator */}
      {isRecording ? (
        <div className="flex items-center gap-2 flex-grow">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-rose-300">
            {formatTime(seconds)}
          </span>

          {/* Animated sound wave bars */}
          <div className="flex items-center gap-1 flex-grow justify-center px-4">
            {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50].map((h, i) => (
              <div 
                key={i} 
                className="w-1 bg-gradient-to-t from-purple-400 to-cyan-400 rounded-full animate-pulse"
                style={{ 
                  height: `${h * 0.25}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>

          <button 
            type="button"
            onClick={handleStopRecording}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold"
            title="Stop Recording"
          >
            <Square className="w-4 h-4 fill-white" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-grow">
          <button 
            type="button"
            onClick={() => setIsPlayingPreview(!isPlayingPreview)}
            className="p-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white transition-all"
          >
            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <span className="text-xs font-mono font-bold text-slate-300">
            Voice Note ({formatTime(seconds)})
          </span>
          <div className="flex-grow flex items-center gap-1 px-3">
            {[20, 30, 15, 25, 30, 18, 22, 28, 14, 20].map((h, i) => (
              <div 
                key={i} 
                className="w-1 bg-purple-400/60 rounded-full"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete / Cancel button */}
      <button 
        type="button"
        onClick={onCancel}
        className="p-2 bg-white/5 hover:bg-rose-600/30 text-rose-400 rounded-xl transition-all"
        title="Discard Voice Note"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Send button */}
      <button 
        type="button"
        onClick={handleSend}
        className="p-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl shadow-md active:scale-95 transition-all"
        title="Send Voice Note"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
