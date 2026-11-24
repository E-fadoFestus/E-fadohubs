import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  FileText,
  Megaphone,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneOff,
  Radio,
  Search,
  Send,
  Users,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { db, collection, limit, onSnapshot, query, where } from '../../firebase';
import { UserProfile } from '../../types';
import { efadoNexusApi } from '../../services/efadoNexusApi';
import { fileToSafeDataUrl, formatRelativeTime } from './nexusTypes';

interface EfadoConnectPageProps {
  user: UserProfile;
  onBack: () => void;
  bargainContext?: any;
}

const DEFAULT_ROOMS = [
  { id: 'connect-general', name: 'EFADO Family Lounge', kind: 'Private & Team Chat', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 'tactical-hq', name: 'Community HQ Group', kind: 'Group Chat', badge: 'bg-sky-100 text-sky-800' },
  { id: 'close-friends', name: 'Close Friends Circle', kind: 'Close Friends Channel', badge: 'bg-purple-100 text-purple-800' },
  { id: 'broadcast-list', name: 'Business Broadcast List', kind: 'Broadcast List', badge: 'bg-amber-100 text-amber-800' },
  { id: 'sarah', name: 'EFADO Concierge Desk', kind: 'Direct Chat', badge: 'bg-rose-100 text-rose-800' },
];

export const EfadoConnectPage: React.FC<EfadoConnectPageProps> = ({
  user,
  onBack,
  bargainContext,
}) => {
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState(
    bargainContext ? `seller-${bargainContext.id || 'deal'}` : 'connect-general'
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState(
    bargainContext ? `Hello! I am interested in "${bargainContext.title}". Can we agree on a price?` : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [disappearingOn, setDisappearingOn] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [activeTab, setActiveTab] = useState<'CHATS' | 'STATUS' | 'CALLS'>('CHATS');

  // Voice Note Recorder
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Active Voice/Video Call Room
  const [activeCall, setActiveCall] = useState<{
    id: string;
    type: 'voice' | 'video';
    title: string;
    muted: boolean;
    videoOn: boolean;
  } | null>(null);
  const [liveCalls, setLiveCalls] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bargainContext) {
      setRooms((prev) => {
        const sid = `seller-${bargainContext.id || 'deal'}`;
        if (prev.some((r) => r.id === sid)) return prev;
        return [
          {
            id: sid,
            name: `${bargainContext.seller || bargainContext.ownerName || 'Seller'} · Bargain`,
            kind: 'Direct Marketplace Chat',
            badge: 'bg-orange-100 text-orange-800',
          },
          ...prev,
        ];
      });
    }
  }, [bargainContext]);

  // Listen to custom groups as rooms too
  useEffect(() => {
    const unsubGroups = onSnapshot(query(collection(db, 'gist_groups'), limit(30)), (snap) => {
      const custom = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || d.id,
        kind: 'Group Chat',
        badge: 'bg-sky-100 text-sky-800',
      }));
      setRooms([...DEFAULT_ROOMS, ...custom.filter((c) => !DEFAULT_ROOMS.some((d) => d.id === c.id))]);
    });

    const unsubCalls = onSnapshot(query(collection(db, 'gist_live_rooms'), limit(20)), (snap) => {
      setLiveCalls(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubGroups();
      unsubCalls();
    };
  }, []);

  // Listen to messages in active room
  useEffect(() => {
    const q = query(
      collection(db, 'gist_chat_messages'),
      where('roomId', '==', activeRoomId),
      limit(120)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const ta = a.timestamp?.seconds || (a.createdAtIso ? Date.parse(a.createdAtIso) / 1000 : 0);
        const tb = b.timestamp?.seconds || (b.createdAtIso ? Date.parse(b.createdAtIso) / 1000 : 0);
        return ta - tb;
      });
      setMessages(list);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    });
    return () => unsub();
  }, [activeRoomId]);

  useEffect(() => {
    if (!isRecording) {
      setRecordSeconds(0);
      return;
    }
    const id = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const currentRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || rooms[0],
    [rooms, activeRoomId]
  );

  const visibleMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        String(m.content || '').toLowerCase().includes(q) ||
        String(m.senderName || '').toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;
    setIsSending(true);
    setFeedback(null);
    try {
      await efadoNexusApi.connect.sendMessage(user, {
        roomId: activeRoomId,
        content: messageText,
        msgType: activeRoomId === 'broadcast-list' ? 'broadcast' : 'text',
        disappearing: disappearingOn,
      });
      setMessageText('');
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileShare = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);
    try {
      const dataUrl = await fileToSafeDataUrl(file);
      await efadoNexusApi.connect.sendMessage(user, {
        roomId: activeRoomId,
        content: file.type.startsWith('image/') ? 'Shared a photo' : `Shared file: ${file.name}`,
        msgType: file.type.startsWith('image/') ? 'image' : 'file',
        mediaUrl: dataUrl,
        fileName: file.name,
        disappearing: disappearingOn,
      });
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    }
  };

  const handleToggleVoiceRecord = async () => {
    setFeedback(null);
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            await efadoNexusApi.connect.sendMessage(user, {
              roomId: activeRoomId,
              content: `Voice note (${Math.max(1, recordSeconds)}s)`,
              msgType: 'voice',
              mediaUrl: String(reader.result || ''),
              voiceDuration: Math.max(1, recordSeconds),
              disappearing: disappearingOn,
            });
          } catch (err: any) {
            setFeedback(err?.message || 'Not sent, please try again.');
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setFeedback('Please allow microphone access on your device to send a voice note.');
    }
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    setFeedback(null);
    try {
      const roomId = await efadoNexusApi.connect.startCallRoom(user, {
        title: `${currentRoom.name} (${type === 'video' ? 'Video Call' : 'Voice Call'})`,
        callType: type,
        roomId: activeRoomId,
      });
      setActiveCall({
        id: roomId,
        type,
        title: currentRoom.name,
        muted: false,
        videoOn: type === 'video',
      });
    } catch (err: any) {
      setFeedback(err?.message || 'Could not start call. Please try again.');
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    await efadoNexusApi.connect.endCallRoom(activeCall.id);
    setActiveCall(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-emerald-100 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">EFADO Connect</h1>
              <p className="text-xs text-slate-600">Private chats, voice notes, calls & close friend channels</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['CHATS', 'STATUS', 'CALLS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold border ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                {tab === 'CHATS' ? 'Chats & Channels' : tab === 'STATUS' ? '24h Status' : 'Calls'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 flex-1 flex flex-col gap-4">
        {feedback && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Call Panel */}
        {activeCall && (
          <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-300 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                {activeCall.type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Live {activeCall.type === 'video' ? 'Video' : 'Voice'} Call · {activeCall.title}
                </p>
                <p className="text-xs text-emerald-800">Connected cleanly inside EFADO Connect</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCall({ ...activeCall, muted: !activeCall.muted })}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-emerald-200 text-sm font-semibold flex items-center gap-1.5"
              >
                {activeCall.muted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-emerald-700" />}
                <span>{activeCall.muted ? 'Muted' : 'Mic On'}</span>
              </button>
              {activeCall.type === 'video' && (
                <button
                  onClick={() => setActiveCall({ ...activeCall, videoOn: !activeCall.videoOn })}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-emerald-200 text-sm font-semibold flex items-center gap-1.5"
                >
                  {activeCall.videoOn ? <Video className="w-4 h-4 text-emerald-700" /> : <VideoOff className="w-4 h-4 text-rose-600" />}
                  <span>{activeCall.videoOn ? 'Camera On' : 'Camera Off'}</span>
                </button>
              )}
              <button
                onClick={handleEndCall}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold flex items-center gap-1.5"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'STATUS' ? (
          <section className="p-6 rounded-3xl bg-purple-50 border border-purple-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Share a 24-Hour Status Update</h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="What are you up to right now?"
                className="flex-1 min-w-[220px] min-h-[44px] px-4 py-2 rounded-xl bg-white border border-purple-200 text-sm"
              />
              <button
                onClick={async () => {
                  try {
                    await efadoNexusApi.stories.createStory(user, { caption: statusNote, kind: 'story' });
                    setStatusNote('');
                    setFeedback('Your status has been posted for 24 hours.');
                  } catch (err: any) {
                    setFeedback(err?.message || 'Not sent, please try again.');
                  }
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold"
              >
                Post Status
              </button>
            </div>
          </section>
        ) : activeTab === 'CALLS' ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liveCalls.map((call) => (
              <div key={call.id} className="p-5 rounded-3xl bg-sky-50 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-sky-800 bg-white px-2.5 py-1 rounded-lg">
                    {call.callType || 'call'} · {call.status || 'live'}
                  </span>
                  <span className="text-xs text-slate-600">{formatRelativeTime(call.createdAt)}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{call.title}</h3>
                <p className="text-sm text-slate-600">Started by {call.hostName || call.ownerName}</p>
              </div>
            ))}
            {liveCalls.length === 0 && (
              <div className="col-span-full p-6 rounded-3xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                No call logs yet. Open any chat and tap Voice Call or Video Call!
              </div>
            )}
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Rooms List */}
            <aside className="lg:col-span-4 space-y-2 p-4 rounded-3xl bg-slate-50 border border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 px-1 mb-2">Chats, Groups & Broadcasts</h2>
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {rooms.map((room) => {
                  const selected = room.id === activeRoomId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-colors ${
                        selected
                          ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{room.name}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${room.badge}`}>
                          {room.kind.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{room.kind}</p>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Chat Thread */}
            <section className="lg:col-span-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col min-h-[540px]">
              {/* Room Header */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentRoom.name}</h3>
                  <p className="text-xs text-slate-500">{currentRoom.kind}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Find message..."
                      className="min-h-[38px] pl-8 pr-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                  </div>
                  <button
                    onClick={() => setDisappearingOn((d) => !d)}
                    className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1 ${
                      disappearingOn
                        ? 'bg-purple-50 border-purple-300 text-purple-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{disappearingOn ? 'Disappearing On' : 'Disappearing'}</span>
                  </button>
                  <button
                    onClick={() => handleStartCall('voice')}
                    className="min-h-[38px] px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>
                  <button
                    onClick={() => handleStartCall('video')}
                    className="min-h-[38px] px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[420px] bg-slate-50/40">
                {visibleMessages.length === 0 ? (
                  <div className="text-center py-12 text-sm text-slate-500">
                    No messages here yet. Send a friendly hello below!
                  </div>
                ) : (
                  visibleMessages.map((m) => {
                    const isMine = m.senderId === user.uid || m.userId === user.uid;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] p-3.5 rounded-2xl border space-y-1.5 ${
                            isMine
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-900 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className={`text-xs font-bold ${isMine ? 'text-emerald-100' : 'text-slate-600'}`}>
                              {m.senderName || m.ownerName || 'Member'}
                            </span>
                            {m.disappearing && (
                              <span className="text-[10px] opacity-80">24h Disappearing</span>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                          {m.msgType === 'voice' && m.mediaUrl && (
                            <audio src={m.mediaUrl} controls className="w-full max-w-[260px] h-9" />
                          )}
                          {m.msgType === 'image' && m.mediaUrl && (
                            <img src={m.mediaUrl} alt="Shared" className="max-h-56 rounded-xl object-cover" />
                          )}
                          {m.msgType === 'file' && m.mediaUrl && (
                            <a
                              href={m.mediaUrl}
                              download={m.fileName || 'efado-file'}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                                isMine ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Download {m.fileName || 'File'}</span>
                            </a>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 px-1">
                          {formatRelativeTime(m.timestamp || m.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSendText}
                className="p-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2 bg-white rounded-b-3xl"
              >
                <label className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <Paperclip className="w-4 h-4" />
                  <span className="hidden sm:inline">File</span>
                  <input type="file" className="hidden" onChange={handleFileShare} />
                </label>

                <button
                  type="button"
                  onClick={handleToggleVoiceRecord}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    isRecording
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{isRecording ? `Stop (${recordSeconds}s)` : 'Voice'}</span>
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 min-w-[160px] min-h-[44px] px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />

                <button
                  type="submit"
                  disabled={isSending}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
