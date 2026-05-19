import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Upload, 
  Monitor, 
  Zap, 
  Sparkles, 
  Video, 
  ArrowLeft,
  Settings,
  Mic,
  MicOff,
  VideoOff,
  Disc,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ReelCreatorProps {
  user: any;
  onClose: () => void;
  onPost: (content: string, mediaUrl: string) => void;
}

type Mode = 'SELECT' | 'CAMERA' | 'UPLOAD' | 'EDIT' | 'SUBMITTING' | 'AI_GEN' | 'TEMPLATES';

export const ReelCreator: React.FC<ReelCreatorProps> = ({ user, onClose, onPost }) => {
  const [mode, setMode] = useState<Mode>('SELECT');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1080, height: 1920 }, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode('CAMERA');
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Please allow camera permissions to create tactical reels.");
    }
  };

  const startScreenShare = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode('CAMERA');
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setVideoUrl(url);
      setMode('EDIT');
      stopStream();
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setMode('EDIT');
    }
  };

  const generateAIReel = async () => {
    if (!aiPrompt) return;
    setIsAiGenerating(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || '';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Based on this concept: "${aiPrompt}", generate a high-engagement, tactical, and viral caption for an EFADO Reel. It should appeal to the new generation of tech-savvy and ambitious users. Use emojis and trending hashtags.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setCaption(text);
      setVideoUrl('https://videos.pexels.com/video-files/3163534/3163534-uhd_2160_3840_30fps.mp4'); // Placeholder viral video
      setMode('EDIT');
    } catch (err) {
      console.error("AI Generation failed:", err);
      setCaption(`Manifesting: ${aiPrompt} 🚀 #EFADO #AI`);
      setVideoUrl('https://videos.pexels.com/video-files/3163534/3163534-uhd_2160_3840_30fps.mp4');
      setMode('EDIT');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const generateAICaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || '';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Create a catchy, "new generation" social media caption for a short video reel on a platform called EFADO (East Meets West). The vibe should be tactical, high-performance, and viral. Use relevant hashtags. The user is ${user.displayName}.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setCaption(text);
    } catch (err) {
      console.error("AI Generation failed:", err);
      setCaption("Tactical flow engaged. 🚀 #EFADO #ViralGist");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleSubmit = () => {
    setMode('SUBMITTING');
    setTimeout(() => {
      onPost(caption, videoUrl || 'https://picsum.photos/seed/reels/1080/1920');
      onClose();
    }, 2000);
  };

  useEffect(() => {
    return () => stopStream();
  }, [stream]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-600 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg aspect-[9/16] max-h-[95vh] bg-black md:rounded-[3rem] shadow-infinite flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative z-50 p-6 flex items-center justify-between">
          <button 
            onClick={mode === 'SELECT' ? onClose : () => { stopStream(); setMode('SELECT'); }}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
          >
            {mode === 'SELECT' ? <X className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </button>
          
          <div className="text-center">
            <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">EFADO Studio</h4>
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Link</span>
            </div>
          </div>

          <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow relative flex flex-col overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {mode === 'SELECT' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 space-y-4 w-full"
              >
                <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 mx-auto mb-4">
                      <Zap className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Viral Generation</h3>
                   <p className="text-gray-500 text-[8px] font-black uppercase tracking-[0.2em] mt-2">Choose your tactical deployment method</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={startCamera}
                    className="p-6 bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 rounded-3xl transition-all flex flex-col items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h5 className="text-sm font-black text-white uppercase tracking-tight">Camera</h5>
                      <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1">Live Capture</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 bg-white/5 border border-white/5 hover:border-rose-500/50 hover:bg-rose-500/10 rounded-3xl transition-all flex flex-col items-center gap-4 group"
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h5 className="text-sm font-black text-white uppercase tracking-tight">Upload</h5>
                      <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1">PC / Cloud</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setMode('AI_GEN')}
                    className="p-6 bg-white/5 border border-white/5 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-3xl transition-all flex flex-col items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h5 className="text-sm font-black text-white uppercase tracking-tight">AI Generated</h5>
                      <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1">Text to Video</p>
                    </div>
                  </button>

                  <button 
                    onClick={startScreenShare}
                    className="p-6 bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 rounded-3xl transition-all flex flex-col items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h5 className="text-sm font-black text-white uppercase tracking-tight">Screen Share</h5>
                      <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1">Tech / Record</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setMode('TEMPLATES')}
                    className="col-span-2 p-6 bg-white/5 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-3xl transition-all flex items-center justify-between px-8 group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all">
                        <Video className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h5 className="text-sm font-black text-white uppercase tracking-tight">Hub Templates</h5>
                        <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1">Pre-built viral structures</p>
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </button>
                </div>

                <div className="pt-4">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Trending Scenarios</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {['Gaming Wins', 'Market Tips', 'Career Insights', 'Tech Trends'].map((trend) => (
                      <button key={trend} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-indigo-400 whitespace-nowrap hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest">
                        {trend}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'AI_GEN' && (
              <motion.div 
                key="ai_gen"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6 flex flex-col h-full"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">AI Pulse Engine</h3>
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Describe your viral vision</p>
                </div>

                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. A high-energy sequence of my new crypto portfolio performing with a tactical overlay..."
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />

                <button 
                  onClick={generateAIReel}
                  disabled={isAiGenerating || !aiPrompt}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isAiGenerating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {isAiGenerating ? 'Materializing...' : 'Generate AI Reel'}
                </button>

                <p className="text-center text-[7px] text-slate-500 font-black uppercase tracking-widest mt-auto">
                  Powered by EFADO Neural Network & Gemini AI
                </p>
              </motion.div>
            )}

            {mode === 'TEMPLATES' && (
              <motion.div 
                key="templates"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-4"
              >
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Hub Templates</h3>
                <div className="space-y-4">
                  {[
                    { id: 'GAME', name: 'Game Winning Streak', desc: 'Auto-syncs with your latest big wins', color: 'from-orange-600 to-red-600' },
                    { id: 'MARKET', name: 'Product Showcase', desc: 'Professional b-roll for Market Hub', color: 'from-emerald-600 to-teal-600' },
                    { id: 'TECH', name: 'Gadget Unboxing', desc: 'Cinematic tech unboxing setup', color: 'from-blue-600 to-indigo-600' },
                    { id: 'CAREER', name: 'Quick Career Tip', desc: 'Professional mentorship overlay', color: 'from-slate-600 to-slate-800' }
                  ].map((tpl) => (
                    <button 
                      key={tpl.id}
                      onClick={() => {
                        setVideoUrl('https://videos.pexels.com/video-files/3129671/3129671-uhd_2160_3840_30fps.mp4');
                        setMode('EDIT');
                      }}
                      className="w-full p-6 bg-white/5 border border-white/5 rounded-3xl text-left flex items-center gap-6 group hover:bg-white/10 transition-all"
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${tpl.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}>
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-white uppercase tracking-tight">{tpl.name}</h5>
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">{tpl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {mode === 'CAMERA' && (
              <motion.div 
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col"
              >
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover grayscale brightness-110"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12">
                   <div className="flex items-center justify-center gap-12 mb-8">
                      <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white">
                        <Mic className="w-6 h-6" />
                      </button>
                      
                      <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-24 h-24 rounded-full border-4 ${isRecording ? 'border-rose-600' : 'border-white'} p-1.5 flex items-center justify-center transition-all hover:scale-110`}
                      >
                         <div className={`w-full h-full ${isRecording ? 'bg-rose-600 rounded-xl' : 'bg-white rounded-full'} animate-pulse`} />
                      </button>

                      <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white">
                        <VideoOff className="w-6 h-6" />
                      </button>
                   </div>
                   <p className="text-center text-white text-[10px] font-black uppercase tracking-[0.3em] italic">
                     {isRecording ? 'TRANSMITTING SIGNAL...' : 'STANDBY MODE'}
                   </p>
                </div>
              </motion.div>
            )}

            {mode === 'EDIT' && (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 flex flex-col bg-slate-900"
              >
                <video 
                  src={videoUrl || ''} 
                  autoPlay 
                  loop 
                  muted 
                  className="w-full h-3/5 object-cover rounded-b-[3rem] shadow-2xl"
                />
                
                <div className="flex-grow p-8 space-y-6 flex flex-col">
                  <div className="relative">
                    <textarea 
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a tactical description..."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                    <button 
                      onClick={generateAICaption}
                      disabled={isGeneratingCaption}
                      className="absolute bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      {isGeneratingCaption ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isGeneratingCaption ? 'Analysing...' : 'AI Pulse'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button className="py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                        <Disc className="w-4 h-4" />
                        Audio Sync
                     </button>
                     <button className="py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                        <Zap className="w-4 h-4" />
                        Effects
                     </button>
                  </div>

                  <button 
                    onClick={handleSubmit}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all mt-auto"
                  >
                    Deploy to Global Bridges
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'SUBMITTING' && (
              <motion.div 
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="relative mb-8">
                   <div className="w-24 h-24 border-4 border-indigo-600/20 rounded-full" />
                   <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                   <Zap className="absolute inset-0 m-auto w-10 h-10 text-indigo-600 animate-pulse" />
                </div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-4">Tactical Transmission In-Progress</h4>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs">Connecting to regional hubs and synchronising data packets with global nodes.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        {mode === 'SELECT' && (
          <div className="p-8 border-t border-white/5 bg-white/5">
             <div className="flex items-center gap-3 text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                <p className="text-[9px] font-black uppercase tracking-[0.15em]">All transmissions are vetted for integrity.</p>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
