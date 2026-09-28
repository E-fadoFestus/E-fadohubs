import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  Globe, 
  Film, 
  Lock, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Send, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  Coins, 
  Sparkle,
  Radio,
  Clock,
  Info,
  Maximize2,
  FileImage,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI } from '../../hooks/useAI';
import { UserProfile } from '../../types';

interface EfadoAiLabPageProps {
  user: UserProfile;
  onNavigateHome: () => void;
  onNavigateHub: (slug: string) => void;
}

export const EfadoAiLabPage: React.FC<EfadoAiLabPageProps> = ({
  user,
  onNavigateHome,
  onNavigateHub
}) => {
  const { 
    generateImage, 
    editImage, 
    searchWithGrounding, 
    startVoiceChat, 
    animateImageToVideo,
    dailyUsage, 
    refreshUsage, 
    videoConfig 
  } = useAI();

  const [activeSection, setActiveSection] = useState<'images' | 'voice' | 'grounding' | 'video'>('images');

  // --------------------------------------------------------------------------
  // SECTION 1: CREATE & EDIT IMAGES STATE
  // --------------------------------------------------------------------------
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);

  // Edit image states
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImg, setIsEditingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImg(true);
    setImageError(null);

    const res = await generateImage(imagePrompt, { aspectRatio: imageAspectRatio });
    if (res.success && res.imageUrl) {
      setGeneratedImageUrl(res.imageUrl);
    } else {
      setImageError(res.error || 'Unable to generate image. Please try a different prompt.');
    }
    setIsGeneratingImg(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageToEdit(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditImage = async () => {
    if (!imageToEdit || !editPrompt.trim()) return;
    setIsEditingImg(true);
    setImageError(null);

    const res = await editImage(editPrompt, imageToEdit);
    if (res.success && res.imageUrl) {
      setGeneratedImageUrl(res.imageUrl);
    } else {
      setImageError(res.error || 'Failed to edit image.');
    }
    setIsEditingImg(false);
  };

  // --------------------------------------------------------------------------
  // SECTION 2: VOICE CONVERSATIONS (GEMINI LIVE API & AUDIO)
  // --------------------------------------------------------------------------
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: `Hello ${user.displayName || 'Champion'}! I am your EFADO AI Tutor & Voice Mentor. What would you like to explore or learn today?`,
      time: 'Live'
    }
  ]);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const voiceSessionRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    voiceSessionRef.current = startVoiceChat({
      onSpeakingChange: (speaking) => setIsSpeaking(speaking)
    });

    // Check browser SpeechRecognition support
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendVoiceMessage(transcript);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      voiceSessionRef.current?.stopAudio();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [startVoiceChat]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      voiceSessionRef.current?.stopAudio();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  };

  const handleSendVoiceMessage = async (textToSend?: string) => {
    const text = (textToSend || voiceInputText).trim();
    if (!text) return;

    const userMsg = {
      role: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setVoiceMessages(prev => [...prev, userMsg]);
    setVoiceInputText('');
    setVoiceLoading(true);

    try {
      const res = await voiceSessionRef.current.sendMessage(text);
      setVoiceMessages(prev => [
        ...prev,
        {
          role: 'assistant' as const,
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Voice send error:', err);
    } finally {
      setVoiceLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 3: GOOGLE SEARCH GROUNDING STATE
  // --------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [groundedResult, setGroundedResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchGrounding = async (queryText?: string) => {
    const q = (queryText || searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);

    const res = await searchWithGrounding(q);
    if (res.success) {
      setGroundedResult(res);
    } else {
      setSearchError(res.error || 'Failed to retrieve grounded intelligence.');
    }
    setIsSearching(false);
  };

  // --------------------------------------------------------------------------
  // SECTION 4: ANIMATE VIDEO (VEO 3) - DISABLED & LOCKED FOR BILLING PROTECTION
  // --------------------------------------------------------------------------
  const [videoPrompt, setVideoPrompt] = useState('Dynamic product rotation commercial with cinematic lens flare');
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [showUnlockNotice, setShowUnlockNotice] = useState(false);

  const handleAttemptVideoGeneration = async () => {
    // Calls animateImageToVideo which triggers billing protection lock
    const res = await animateImageToVideo(videoPrompt, generatedImageUrl || 'placeholder');
    setShowUnlockNotice(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500 selection:text-white pb-24">
      {/* Top Banner & Billing Protection Status Bar */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-purple-500/20 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              EFADO AI LAB
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                PROD v3.8
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Centralized, Protected Intelligence Workshop for All 10 EFADO Hubs
            </p>
          </div>
        </div>

        {/* Daily Free Billing Meter */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-purple-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2.5 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase text-slate-400 leading-tight">Billing Protection</p>
              <p className="text-xs font-black text-purple-300">{dailyUsage.usageText}</p>
            </div>
            <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden ml-1 border border-slate-700">
              <div 
                className={`h-full transition-all duration-500 ${
                  dailyUsage.remaining === 0 ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (dailyUsage.used / dailyUsage.max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setActiveSection('images')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeSection === 'images'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>1. Create & Edit Images</span>
          </button>

          <button
            onClick={() => setActiveSection('voice')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeSection === 'voice'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>2. Voice Conversations</span>
          </button>

          <button
            onClick={() => setActiveSection('grounding')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeSection === 'grounding'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Search Grounding</span>
          </button>

          <button
            onClick={() => setActiveSection('video')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all relative ${
              activeSection === 'video'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>4. Animate Video (Veo 3)</span>
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-tighter">
              LOCKED
            </span>
          </button>
        </div>

        {/* ================================================================== */}
        {/* SECTION 1: CREATE & EDIT IMAGES */}
        {/* ================================================================== */}
        {activeSection === 'images' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Section 1: AI Visual Studio (Create & Edit Images)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Generate high-converting marketing creatives, product renders, and banner assets.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">
                  Model: Gemini Flash Image Lite
                </span>
              </div>

              {imageError && (
                <div className="p-4 bg-rose-950/60 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{imageError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Generation Controls */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Visual Prompt Description
                    </label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="e.g. Ultra high-end luxury leather wristwatch packaging box, studio spotlight, 4k commercial render, pristine elegance"
                      rows={4}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-500 outline-none transition-all resize-none font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: '1:1', label: '1:1 Square' },
                        { id: '16:9', label: '16:9 Banner' },
                        { id: '9:16', label: '9:16 Story/Reel' },
                        { id: '4:3', label: '4:3 Standard' }
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => setImageAspectRatio(ratio.id as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                            imageAspectRatio === ratio.id
                              ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                              : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImg || !imagePrompt.trim() || dailyUsage.remaining <= 0}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {isGeneratingImg ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Synthesizing Image...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Image Now</span>
                      </>
                    )}
                  </button>

                  {/* Preset inspiration prompts */}
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quick Prompt Presets:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Modern organic African coffee packaging mockup',
                        'Futuristic solar-powered farming tractor in sunrise',
                        'Luxury penthouse apartment interior in Victoria Island Lagos',
                        'Handmade Nigerian bespoke agbada in royal indigo and gold'
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImagePrompt(preset)}
                          className="text-[11px] text-slate-400 bg-slate-950 hover:text-purple-300 hover:border-purple-500/40 border border-white/5 px-3 py-1 rounded-xl transition-all text-left"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image Output & Editing Canvas */}
                <div className="flex flex-col space-y-4">
                  <div className="flex-1 min-h-[300px] bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    {generatedImageUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <img 
                          src={generatedImageUrl} 
                          alt="AI Generated Output" 
                          className="max-h-[380px] w-auto object-contain rounded-xl shadow-2xl"
                        />
                        <div className="flex items-center gap-2 mt-4">
                          <a
                            href={generatedImageUrl}
                            download="efado-ai-creation.png"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                          <button
                            onClick={() => {
                              setImageToEdit(generatedImageUrl);
                              setActiveSection('images');
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Edit This Image</span>
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedImageUrl);
                              setCopiedImage(true);
                              setTimeout(() => setCopiedImage(false), 2000);
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                            title="Copy Data URI"
                          >
                            {copiedImage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 space-y-3">
                        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-600">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No Image Generated Yet</p>
                        <p className="text-xs text-slate-600 max-w-xs">
                          Enter your creative brief and hit "Generate Image Now" to synthesize real-time visuals.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sub-Editor: Modify Existing Image */}
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        Modify / Edit Existing Image
                      </span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-purple-300 hover:underline flex items-center gap-1"
                      >
                        <FileImage className="w-3.5 h-3.5" />
                        Upload Custom Image
                      </button>
                    </div>

                    {imageToEdit && (
                      <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-white/5">
                        <img src={imageToEdit} alt="To Edit" className="w-12 h-12 object-cover rounded-lg border border-purple-500/30" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">Image Loaded for Modification</p>
                          <p className="text-[10px] text-slate-400">Provide instructions to transform this asset</p>
                        </div>
                        <button 
                          onClick={() => setImageToEdit(null)}
                          className="text-xs text-slate-500 hover:text-rose-400 font-bold px-2"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="e.g. Add subtle golden sparkles and a futuristic glow effect"
                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={handleEditImage}
                        disabled={isEditingImg || !imageToEdit || !editPrompt.trim()}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all"
                      >
                        {isEditingImg ? 'Editing...' : 'Apply Edit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* SECTION 2: VOICE CONVERSATIONS (GEMINI LIVE API & TUTOR) */}
        {/* ================================================================== */}
        {activeSection === 'voice' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
                    Section 2: Voice Conversations (Gemini Live API & Audio)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time two-way voice conversations with your EFADO AI Strategic Advisor & Educational Tutor.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isSpeaking ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Volume2 className="w-3 h-3" />
                    {isSpeaking ? 'AI Tutor Speaking' : 'Audio Ready'}
                  </span>
                </div>
              </div>

              {/* Interactive Voice Waveform Sphere */}
              <div className="bg-slate-950 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="relative mb-6">
                  {/* Glowing Pulse Rings */}
                  <div className={`absolute -inset-4 rounded-full transition-all duration-700 ${
                    isListening ? 'bg-rose-500/20 blur-xl animate-ping' : isSpeaking ? 'bg-sky-500/20 blur-xl animate-pulse' : 'bg-purple-500/5'
                  }`} />
                  
                  <button
                    onClick={toggleListening}
                    className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
                      isListening
                        ? 'bg-rose-600 text-white scale-110 shadow-rose-600/50'
                        : isSpeaking
                        ? 'bg-sky-600 text-white shadow-sky-600/50 animate-pulse'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:scale-105 text-white shadow-purple-600/30'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-8 h-8 animate-bounce" />
                        <span className="text-[9px] font-black uppercase mt-1">Listening</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-8 h-8" />
                        <span className="text-[9px] font-black uppercase mt-1">Tap To Talk</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-white">
                    {isListening 
                      ? 'Listening to your microphone... Speak clearly.' 
                      : isSpeaking 
                      ? 'AI Tutor is replying with voice synthesis...' 
                      : 'Tap the microphone or type below to converse with the AI Tutor.'}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    High-throughput natural conversational latency active
                  </p>
                </div>
              </div>

              {/* Chat Transcript Area */}
              <div className="space-y-4">
                <div className="max-h-72 overflow-y-auto space-y-3 p-4 bg-slate-950 border border-white/10 rounded-2xl custom-scrollbar">
                  {voiceMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {msg.role === 'user' ? (user.displayName || 'You') : 'EFADO AI Tutor'}
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">{msg.time}</span>
                      </div>
                      <div 
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-purple-600 text-white rounded-tr-none' 
                            : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {voiceLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic p-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>AI Tutor formulating voice response...</span>
                    </div>
                  )}
                </div>

                {/* Text Input Fallback */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendVoiceMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={voiceInputText}
                    onChange={(e) => setVoiceInputText(e.target.value)}
                    placeholder="Type a question for the AI Tutor (or use microphone above)..."
                    className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!voiceInputText.trim() || voiceLoading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* SECTION 3: USE GOOGLE SEARCH DATA GROUNDING */}
        {/* ================================================================== */}
        {activeSection === 'grounding' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    Section 3: Live Google Search Data Grounding
                  </h2>
                  <p className="text-xs text-slate-400">
                    Retrieve real-time web facts, verified current market rates, citations, and live intelligence.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                    Google Search Tool Active
                  </span>
                </div>
              </div>

              {searchError && (
                <div className="p-4 bg-rose-950/60 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Search Box */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounding()}
                      placeholder="Ask any real-time question: e.g. Current global exchange rates for NGN and USD, Nigeria customs import tariffs 2026..."
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>
                  <button
                    onClick={() => handleSearchGrounding()}
                    disabled={isSearching || !searchQuery.trim() || dailyUsage.remaining <= 0}
                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 shrink-0"
                  >
                    {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    <span>{isSearching ? 'Searching...' : 'Ground Search'}</span>
                  </button>
                </div>

                {/* Popular Query Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grounded Topics:</span>
                  {[
                    'Nigeria inflation rate and CBN monetary policies',
                    'Top trending electronics imports from Guangzhou China to Lagos',
                    'WAEC & JAMB cut-off updates 2026',
                    'Best solar battery storage setups for home office in Nigeria'
                  ].map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(topic);
                        handleSearchGrounding(topic);
                      }}
                      className="text-[11px] font-medium text-slate-400 bg-slate-950 hover:text-emerald-300 hover:border-emerald-500/40 border border-white/5 px-3 py-1 rounded-xl transition-all"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grounded Result Display */}
              {groundedResult && (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Verified Real-Time Search Intelligence
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Grounded via Google Search</span>
                  </div>

                  <div className="text-sm font-normal text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {groundedResult.text}
                  </div>

                  {/* Sources & Citations */}
                  {groundedResult.sources && groundedResult.sources.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Sources & Web Citations:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {groundedResult.sources.map((src: any, i: number) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 p-3 bg-slate-900 hover:bg-slate-850 border border-white/10 rounded-xl text-xs text-emerald-400 hover:text-emerald-300 transition-all group"
                          >
                            <span className="truncate font-semibold">{src.title || 'Verified Source'}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* SECTION 4: ANIMATE IMAGES INTO VIDEO (VEO 3) - DISABLED & LOCKED */}
        {/* ================================================================== */}
        {activeSection === 'video' && (
          <div className="space-y-6 animate-fadeIn relative">
            {/* Fully Modeled UI Container (Present but rendered underneath the Lock Screen) */}
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 relative overflow-hidden">
              {/* High-Tech Amber/Rose Lock Screen Overlay */}
              <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/50 rounded-3xl p-8 shadow-2xl shadow-amber-500/10 space-y-6 relative">
                  <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/20 animate-pulse">
                    <Lock className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase font-black tracking-widest">
                      Zero Billing Protected
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight pt-2">
                      {videoConfig.lockScreenText}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Google Veo 3 Video Ad Generation is currently inactive to protect you from unexpected cloud billing charges.
                    </p>
                  </div>

                  {/* Monetization Details Card */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 text-left space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Unlock Access Fee:</span>
                      <span className="font-black text-amber-400 text-sm">{videoConfig.unlockFeeFormatted}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Usage After Unlock:</span>
                      <span className="font-bold text-emerald-400">Unlimited Generation</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Free Tier Limit:</span>
                      <span className="font-mono text-slate-300">{videoConfig.currentFreeDailyLimit} calls (2 free daily later)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Watermark Status:</span>
                      <span className="font-mono text-slate-400">"{videoConfig.watermark}"</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-left">
                    <p className="text-[11px] font-mono text-amber-300 leading-tight">
                      // Status: Veo 3 API calls are disabled.<br />
                      // Ready for: "Enable Video" activation command.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowUnlockNotice(true)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View Monetization & Unlock Roadmap
                  </button>
                </div>
              </div>

              {/* Underlying Mocked Studio UI (Proof of Complete Implementation) */}
              <div className="opacity-30 pointer-events-none filter blur-sm">
                <h3 className="text-lg font-black text-white uppercase">Veo 3 Video Ad Generator</h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="h-48 bg-slate-950 rounded-2xl border border-white/10" />
                  <div className="space-y-4">
                    <div className="h-10 bg-slate-950 rounded-xl" />
                    <div className="h-24 bg-slate-950 rounded-xl" />
                    <div className="h-12 bg-amber-600 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unlock Notice Modal */}
      <AnimatePresence>
        {showUnlockNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base uppercase text-white">Veo 3 Monetization Architecture</h3>
                    <p className="text-xs text-amber-400 font-mono">Status: Ready & Safely Inactive</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUnlockNotice(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-medium">
                <p>
                  To protect your Google Cloud billing account, <strong>Veo 3 video generation is strictly locked in code</strong>. No calls to the Veo API will occur until you give the explicit prompt "Enable Video".
                </p>

                <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <p className="font-bold text-white uppercase text-[11px] tracking-wider">Configured Economics:</p>
                  <ul className="space-y-1.5 text-slate-400">
                    <li>• Unlock Fee: <strong>NGN 5,000.00</strong> (one-time platform unlock fee).</li>
                    <li>• Daily Free Limit: <strong>0 calls now</strong> (will switch to 2 free generations later).</li>
                    <li>• Free Tier Watermark: <strong>"Made with EFADO AI"</strong>.</li>
                    <li>• Paid Tier: Unlimited high-definition advertisement video production.</li>
                  </ul>
                </div>

                <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl">
                  <p className="font-mono text-[11px] text-purple-300">
                    // TODO: Connect to payment gateway - Billing Account: [USER TO INSERT BILLING ACCOUNT DETAILS HERE] - All N5000 payments should go to this account to cover Google Veo billing
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUnlockNotice(false)}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Close & Return to AI Lab
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
