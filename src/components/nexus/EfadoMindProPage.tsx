import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Cpu,
  Heart,
  Lightbulb,
  MessageSquare,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Timer,
  UserCheck,
  Volume2,
  X,
} from 'lucide-react';
import { db, collection, limit, onSnapshot, query } from '../../firebase';
import { UserProfile } from '../../types';
import { efadoNexusApi } from '../../services/efadoNexusApi';
import { formatRelativeTime } from './nexusTypes';

interface EfadoMindProPageProps {
  user: UserProfile;
  onBack: () => void;
}

type MindProSection = 'VOICE_MARK' | 'EFADO_AI' | 'CHAT_HUMAN' | 'MIND_TECH' | 'REASON_FACULTIES';
type ReasonFaculty = 'Reason' | 'Logic' | 'Truth' | 'Wisdom' | 'Debate' | 'Ideas';

const FACULTIES: Array<{ name: ReasonFaculty; color: string; desc: string }> = [
  { name: 'Reason', color: 'bg-indigo-50 border-indigo-200', desc: 'Clear thinking for everyday choices' },
  { name: 'Logic', color: 'bg-sky-50 border-sky-200', desc: 'Step-by-step sound judgement' },
  { name: 'Truth', color: 'bg-emerald-50 border-emerald-200', desc: 'Honest facts and verified clarity' },
  { name: 'Wisdom', color: 'bg-amber-50 border-amber-200', desc: 'Tested life and business lessons' },
  { name: 'Debate', color: 'bg-rose-50 border-rose-200', desc: 'Respectful two-sided exchange' },
  { name: 'Ideas', color: 'bg-purple-50 border-purple-200', desc: 'Fresh solutions that help people' },
];

export const EfadoMindProPage: React.FC<EfadoMindProPageProps> = ({ user, onBack }) => {
  const [section, setSection] = useState<MindProSection>('VOICE_MARK');
  const [entries, setEntries] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // 1. Voice Mark state
  const [voicePhrase, setVoicePhrase] = useState('My voice is my EFADO signature.');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 2. EFADO AI state
  const [aiMode, setAiMode] = useState<'write_gist' | 'reply_chat' | 'create_advert' | 'plan_business'>('write_gist');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // 3. Chat With Human state
  const [humanTopic, setHumanTopic] = useState<'Human Support' | 'Mentor Guidance' | 'Verified Expert' | 'Real Friend Chat'>('Human Support');
  const [humanMessage, setHumanMessage] = useState('');
  const [humanSending, setHumanSending] = useState(false);

  // 4. Mind Pro Tech (Focus Timer + Memory Drill + Notes)
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(15 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [memoryNumbers, setMemoryNumbers] = useState<number[]>(() =>
    Array.from({ length: 4 }, () => Math.floor(10 + Math.random() * 89))
  );
  const [hideMemory, setHideMemory] = useState(false);
  const [memoryGuess, setMemoryGuess] = useState('');
  const [mindNoteTitle, setMindNoteTitle] = useState('');
  const [mindNoteBody, setMindNoteBody] = useState('');

  // 5. Home of Reason Faculties
  const [selectedFaculty, setSelectedFaculty] = useState<ReasonFaculty>('Reason');
  const [facultyTitle, setFacultyTitle] = useState('');
  const [facultyContent, setFacultyContent] = useState('');
  const [facultyCommentDraft, setFacultyCommentDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubEntries = onSnapshot(query(collection(db, 'nexus_mind_pro_entries'), limit(100)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setEntries(list);
    });
    const unsubSessions = onSnapshot(query(collection(db, 'nexus_mind_pro_sessions'), limit(40)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setSessions(list);
    });
    return () => {
      unsubEntries();
      unsubSessions();
    };
  }, []);

  useEffect(() => {
    if (!isRecordingVoice) return;
    const id = setInterval(() => setVoiceDuration((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecordingVoice]);

  useEffect(() => {
    if (!focusRunning || focusSecondsLeft <= 0) return;
    const id = setInterval(() => setFocusSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [focusRunning, focusSecondsLeft]);

  const facultyEntries = useMemo(
    () => entries.filter((e) => e.section === 'faculty' && e.faculty === selectedFaculty),
    [entries, selectedFaculty]
  );

  const voiceMarks = useMemo(
    () => entries.filter((e) => e.section === 'voice_mark'),
    [entries]
  );

  const handleToggleVoiceSample = async () => {
    setFeedback(null);
    if (isRecordingVoice && mediaRecRef.current) {
      mediaRecRef.current.stop();
      setIsRecordingVoice(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      setVoiceDuration(0);
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => setRecordedAudioUrl(String(reader.result || ''));
        reader.readAsDataURL(blob);
      };
      mediaRecRef.current = rec;
      rec.start();
      setIsRecordingVoice(true);
    } catch {
      setFeedback('Please allow microphone access to record your Voice Mark.');
    }
  };

  const handleVerifyAndSaveVoiceMark = async () => {
    setFeedback(null);
    try {
      const res = await efadoNexusApi.mindPro.verifyVoiceMark(
        user,
        Math.max(2, voiceDuration),
        spokenTranscript || voicePhrase,
        recordedAudioUrl
      );
      setFeedback(`Voice Mark verified! Code: ${res.voiceMarkCode}`);
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    }
  };

  const handleVoiceToPostDictation = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setFeedback('Live speech-to-text is not supported on this browser; please type or record audio above.');
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = 'en-US';
    setIsListeningSpeech(true);
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      setSpokenTranscript((prev) => (prev ? `${prev} ${text}` : text));
    };
    recognition.onerror = () => setIsListeningSpeech(false);
    recognition.onend = () => setIsListeningSpeech(false);
    recognition.start();
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setFeedback(null);
    try {
      const reply = await efadoNexusApi.mindPro.askEfadoAi({
        mode: aiMode,
        prompt: aiPrompt,
        userName: user.displayName || 'Member',
      });
      setAiAnswer(reply);
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublishAiDraft = async () => {
    if (!aiAnswer.trim()) return;
    try {
      await efadoNexusApi.feed.createPost(user, { content: aiAnswer, category: 'MIND_PRO' });
      setFeedback('Published your EFADO AI draft directly to Gist World!');
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    }
  };

  const handleHumanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHumanSending(true);
    setFeedback(null);
    try {
      await efadoNexusApi.mindPro.sendHumanChatMessage(user, {
        topic: humanTopic,
        message: humanMessage,
      });
      setHumanMessage('');
      setFeedback('Sent! A real EFADO human support mentor will contact you shortly.');
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    } finally {
      setHumanSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-indigo-100 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">EFADO Mind Pro · Home of Reason</h1>
              <p className="text-xs text-slate-600">Voice Mark, EFADO AI, Real Human Chat, Mind Tech & Reason Faculties</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'VOICE_MARK', label: 'Voice Mark', icon: Mic },
              { id: 'EFADO_AI', label: 'EFADO AI', icon: Sparkles },
              { id: 'CHAT_HUMAN', label: 'Chat With Human', icon: UserCheck },
              { id: 'MIND_TECH', label: 'Mind Pro Tech', icon: Cpu },
              { id: 'REASON_FACULTIES', label: 'Home of Reason', icon: Brain },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id as MindProSection)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 border ${
                    section === item.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {feedback && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. VOICE MARK */}
        {section === 'VOICE_MARK' && (
          <section className="space-y-5">
            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">EFADO Voice Mark</h2>
                  <p className="text-sm text-slate-600">
                    Record your voice signature, speak to write posts, or verify your identity by voice.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleToggleVoiceSample}
                  className={`min-h-[48px] px-4 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 ${
                    isRecordingVoice
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-indigo-300 text-indigo-900 hover:bg-indigo-100'
                  }`}
                >
                  {isRecordingVoice ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>
                    {isRecordingVoice
                      ? `Stop Recording (${voiceDuration}s)`
                      : 'Record Voice Signature'}
                  </span>
                </button>

                <button
                  onClick={handleVoiceToPostDictation}
                  className="min-h-[48px] px-4 py-3 rounded-2xl bg-white border border-indigo-300 text-indigo-900 hover:bg-indigo-100 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isListeningSpeech ? 'Listening now...' : 'Voice-to-Post Dictation'}</span>
                </button>
              </div>

              {recordedAudioUrl && <audio src={recordedAudioUrl} controls className="w-full" />}

              <textarea
                rows={3}
                value={spokenTranscript || voicePhrase}
                onChange={(e) => setSpokenTranscript(e.target.value)}
                placeholder="Your spoken words or verification phrase appear here..."
                className="w-full p-3.5 rounded-2xl bg-white border border-indigo-200 text-sm"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleVerifyAndSaveVoiceMark}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Save Voice Mark</span>
                </button>
                <button
                  onClick={async () => {
                    const txt = (spokenTranscript || voicePhrase).trim();
                    try {
                      await efadoNexusApi.feed.createPost(user, { content: txt, category: 'VOICE_MARK' });
                      setFeedback('Voice-to-Post published to Gist World!');
                    } catch (err: any) {
                      setFeedback(err?.message || 'Not sent, please try again.');
                    }
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                >
                  Publish Spoken Text to Gist
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {voiceMarks.map((vm) => (
                <div key={vm.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {vm.title}
                    </span>
                    <span className="text-xs text-slate-500">{formatRelativeTime(vm.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-800">{vm.content}</p>
                  {vm.audioUrl && <audio src={vm.audioUrl} controls className="w-full h-9" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. EFADO AI */}
        {section === 'EFADO_AI' && (
          <section className="p-6 rounded-3xl bg-sky-50 border border-sky-200 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">EFADO AI Assistant</h2>
              <p className="text-sm text-slate-600">
                Your personal writing & planning helper to write gist, reply chats, draft adverts, or plan business.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'write_gist', label: 'Write Gist' },
                { id: 'reply_chat', label: 'Reply Chat' },
                { id: 'create_advert', label: 'Create Advert' },
                { id: 'plan_business', label: 'Plan Business' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiMode(m.id as any)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold border ${
                    aiMode === m.id
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-800 border-sky-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAskAi} className="space-y-3">
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Tell EFADO AI what you want to write, reply, promote, or plan..."
                className="w-full p-3.5 rounded-2xl bg-white border border-sky-200 text-sm sm:text-base"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{aiLoading ? 'Thinking...' : 'Ask EFADO AI'}</span>
              </button>
            </form>

            {aiAnswer && (
              <div className="p-5 rounded-2xl bg-white border border-sky-200 space-y-3">
                <p className="text-xs font-bold uppercase text-sky-700">EFADO AI Suggestion</p>
                <p className="text-sm sm:text-base text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {aiAnswer}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handlePublishAiDraft}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                  >
                    Publish Draft to Gist World
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(aiAnswer);
                      setFeedback('Copied EFADO AI text!');
                    }}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold"
                  >
                    Copy Text
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 3. CHAT WITH HUMAN */}
        {section === 'CHAT_HUMAN' && (
          <section className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chat With a Real Human</h2>
              <p className="text-sm text-slate-600">
                Prefer talking to a real person instead of AI? Reach real human support, mentors, and experts here.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Human Support', 'Mentor Guidance', 'Verified Expert', 'Real Friend Chat'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHumanTopic(t)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold border ${
                    humanTopic === t
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-800 border-emerald-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleHumanSubmit} className="space-y-3">
              <textarea
                rows={4}
                value={humanMessage}
                onChange={(e) => setHumanMessage(e.target.value)}
                placeholder={`Write your message for ${humanTopic}...`}
                className="w-full p-3.5 rounded-2xl bg-white border border-emerald-200 text-sm sm:text-base"
              />
              <button
                type="submit"
                disabled={humanSending}
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{humanSending ? 'Sending...' : 'Send to Real Human'}</span>
              </button>
            </form>
          </section>
        )}

        {/* 4. MIND PRO TECH */}
        {section === 'MIND_TECH' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-purple-50 border border-purple-200 space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Timer className="w-5 h-5 text-purple-700" />
                <span>Deep Focus & Brain Training</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-purple-200 text-center space-y-3">
                <p className="text-4xl font-bold text-slate-900 tabular-nums">
                  {String(Math.floor(focusSecondsLeft / 60)).padStart(2, '0')}:
                  {String(focusSecondsLeft % 60).padStart(2, '0')}
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setFocusRunning((r) => !r)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold"
                  >
                    {focusRunning ? 'Pause' : 'Start Focus'}
                  </button>
                  <button
                    onClick={() => {
                      setFocusRunning(false);
                      setFocusSecondsLeft(15 * 60);
                    }}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold"
                  >
                    Reset 15m
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-purple-200 space-y-2">
                <p className="text-sm font-bold text-slate-900">Quick Memory Recall Check</p>
                <p className="text-lg font-bold tracking-widest text-purple-800">
                  {hideMemory ? '••  ••  ••  ••' : memoryNumbers.join('  ')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setHideMemory((h) => !h)}
                    className="min-h-[38px] px-3 py-1 rounded-xl bg-purple-100 text-purple-900 text-xs font-semibold"
                  >
                    {hideMemory ? 'Show Numbers' : 'Hide & Test Recall'}
                  </button>
                  <button
                    onClick={() => {
                      setMemoryNumbers(Array.from({ length: 4 }, () => Math.floor(10 + Math.random() * 89)));
                      setHideMemory(false);
                      setMemoryGuess('');
                    }}
                    className="min-h-[38px] px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                  >
                    New Numbers
                  </button>
                </div>
                <input
                  type="text"
                  value={memoryGuess}
                  onChange={(e) => setMemoryGuess(e.target.value)}
                  placeholder="Type the 4 numbers you remember..."
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Lightbulb className="w-5 h-5 text-amber-700" />
                <span>Save Clarity & Study Notes</span>
              </div>
              <input
                type="text"
                value={mindNoteTitle}
                onChange={(e) => setMindNoteTitle(e.target.value)}
                placeholder="Topic or idea title"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-sm"
              />
              <textarea
                rows={4}
                value={mindNoteBody}
                onChange={(e) => setMindNoteBody(e.target.value)}
                placeholder="Write what you learned or planned..."
                className="w-full p-3.5 rounded-xl bg-white border border-amber-200 text-sm"
              />
              <button
                onClick={async () => {
                  try {
                    await efadoNexusApi.mindPro.saveMindTechNote(user, {
                      title: mindNoteTitle,
                      note: mindNoteBody,
                      focusMinutes: Math.round((15 * 60 - focusSecondsLeft) / 60),
                    });
                    setMindNoteTitle('');
                    setMindNoteBody('');
                    setFeedback('Note saved to Mind Pro Tech!');
                  } catch (err: any) {
                    setFeedback(err?.message || 'Not sent, please try again.');
                  }
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold"
              >
                Save Study Note
              </button>

              <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
                {sessions.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-white border border-amber-200">
                    <p className="text-xs font-bold text-slate-900">{s.title}</p>
                    <p className="text-xs text-slate-600">{s.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. HOME OF REASON FACULTIES */}
        {section === 'REASON_FACULTIES' && (
          <section className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {FACULTIES.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFaculty(f.name)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedFaculty === f.name
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : `${f.color} text-slate-900`
                  }`}
                >
                  <p className="text-sm font-bold">{f.name}</p>
                  <p className={`text-[11px] mt-0.5 ${selectedFaculty === f.name ? 'text-indigo-100' : 'text-slate-600'}`}>
                    {f.desc}
                  </p>
                </button>
              ))}
            </div>

            <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-200 space-y-3">
              <h2 className="text-base font-bold text-slate-900">Share in Faculty of {selectedFaculty}</h2>
              <input
                type="text"
                value={facultyTitle}
                onChange={(e) => setFacultyTitle(e.target.value)}
                placeholder={`Topic for ${selectedFaculty}...`}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-white border border-indigo-200 text-sm"
              />
              <textarea
                rows={3}
                value={facultyContent}
                onChange={(e) => setFacultyContent(e.target.value)}
                placeholder="Write a clear, thoughtful point or question..."
                className="w-full p-3.5 rounded-xl bg-white border border-indigo-200 text-sm"
              />
              <button
                onClick={async () => {
                  try {
                    await efadoNexusApi.mindPro.createFacultyEntry(user, {
                      faculty: selectedFaculty,
                      title: facultyTitle,
                      content: facultyContent,
                    });
                    setFacultyTitle('');
                    setFacultyContent('');
                    setFeedback(`Shared in ${selectedFaculty}!`);
                  } catch (err: any) {
                    setFeedback(err?.message || 'Not sent, please try again.');
                  }
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
              >
                Publish Thought
              </button>
            </div>

            <div className="space-y-3">
              {facultyEntries.map((item) => {
                const liked = Array.isArray(item.likes) && item.likes.includes(user.uid);
                return (
                  <article key={item.id} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500">
                          {item.ownerName || item.authorName} · {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg">
                        {item.faculty}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{item.content}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => efadoNexusApi.mindPro.toggleLikeEntry(user, item.id, liked)}
                        className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border ${
                          liked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>{(item.likes || []).length}</span>
                      </button>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {(item.comments || []).length} replies
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={facultyCommentDraft[item.id] || ''}
                        onChange={(e) =>
                          setFacultyCommentDraft((p) => ({ ...p, [item.id]: e.target.value }))
                        }
                        placeholder="Add your perspective..."
                        className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await efadoNexusApi.mindPro.addEntryComment(user, item.id, facultyCommentDraft[item.id] || '');
                            setFacultyCommentDraft((p) => ({ ...p, [item.id]: '' }));
                          } catch (err: any) {
                            setFeedback(err?.message || 'Not sent, please try again.');
                          }
                        }}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                      >
                        Reply
                      </button>
                    </div>
                  </article>
                );
              })}
              {facultyEntries.length === 0 && (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                  Be the first to share a note in the Faculty of {selectedFaculty}.
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
