import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  FileText,
  Megaphone,
  Paperclip,
  Pin,
  Plus,
  Send,
  Shield,
  Users,
  Vote,
  X,
} from 'lucide-react';
import { db, collection, limit, onSnapshot, query, where } from '../../firebase';
import { UserProfile } from '../../types';
import { efadoNexusApi } from '../../services/efadoNexusApi';
import { fileToSafeDataUrl, formatRelativeTime } from './nexusTypes';

interface EfadoAssemblyPageProps {
  user: UserProfile;
  onBack: () => void;
}

export const EfadoAssemblyPage: React.FC<EfadoAssemblyPageProps> = ({ user, onBack }) => {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newKind, setNewKind] = useState<'channel' | 'group' | 'broadcast'>('channel');
  const [newCap, setNewCap] = useState(200000);
  const [showCreateBox, setShowCreateBox] = useState(false);

  const [msgText, setMsgText] = useState('');
  const [msgKind, setMsgKind] = useState<'announcement' | 'message' | 'poll'>('announcement');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [slowMode, setSlowMode] = useState(0);
  const [autoReplyText, setAutoReplyText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'gist_communities'), limit(60)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChannels(list);
      if (!selectedChannelId && list.length > 0) {
        setSelectedChannelId(list[0].id);
      }
    });
    return () => unsub();
  }, [selectedChannelId]);

  useEffect(() => {
    if (!selectedChannelId) return;
    const unsub = onSnapshot(
      query(
        collection(db, 'nexus_assembly_messages'),
        where('channelId', '==', selectedChannelId),
        limit(100)
      ),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setMessages(list);
      }
    );
    return () => unsub();
  }, [selectedChannelId]);

  const currentChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) || null,
    [channels, selectedChannelId]
  );

  useEffect(() => {
    if (currentChannel) {
      setSlowMode(Number(currentChannel.slowModeSeconds || 0));
      setAutoReplyText(String(currentChannel.autoResponder || ''));
    }
  }, [currentChannel?.id]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const id = await efadoNexusApi.assembly.createChannel(user, {
        name: newName,
        description: newDesc,
        kind: newKind,
        maxMembers: newCap,
      });
      setSelectedChannelId(id);
      setNewName('');
      setNewDesc('');
      setShowCreateBox(false);
      setFeedback('Channel created in EFADO Assembly!');
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    }
  };

  const handleSendToChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId) {
      setFeedback('Create or select a channel first.');
      return;
    }
    setFeedback(null);
    try {
      const pollPayload =
        msgKind === 'poll' && msgText.trim() && pollOpt1.trim() && pollOpt2.trim()
          ? {
              question: msgText.trim(),
              options: [
                { label: pollOpt1.trim(), votes: [] },
                { label: pollOpt2.trim(), votes: [] },
              ],
            }
          : undefined;

      await efadoNexusApi.assembly.postChannelMessage(user, {
        channelId: selectedChannelId,
        content: msgText,
        msgKind,
        poll: pollPayload,
      });
      setMsgText('');
      setPollOpt1('');
      setPollOpt2('');
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !selectedChannelId) return;
    try {
      const url = await fileToSafeDataUrl(f);
      await efadoNexusApi.assembly.postChannelMessage(user, {
        channelId: selectedChannelId,
        content: `Shared file: ${f.name}`,
        msgKind: 'file',
        fileName: f.name,
        fileUrl: url,
      });
    } catch (err: any) {
      setFeedback(err?.message || 'Not sent, please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-amber-100 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">EFADO Assembly</h1>
              <p className="text-xs text-slate-600">Big channels (up to 200,000 members), broadcasts, polls & tools</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateBox((s) => !s)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Channel or Group</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {feedback && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {showCreateBox && (
          <form onSubmit={handleCreateChannel} className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
            <h2 className="text-base font-bold text-slate-900">Create Big Channel or Community</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Channel or community name"
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-sm"
              />
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as any)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-sm"
              >
                <option value="channel">Big Public Channel</option>
                <option value="broadcast">Official Broadcasts</option>
                <option value="group">Large Community Group</option>
              </select>
              <input
                type="number"
                value={newCap}
                onChange={(e) => setNewCap(Number(e.target.value))}
                placeholder="Member limit (up to 200000)"
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-sm"
              />
            </div>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What announcements or discussions happen here?"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-amber-200 text-sm"
            />
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm"
            >
              Launch in EFADO Assembly
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Channels Sidebar */}
          <aside className="lg:col-span-4 p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
            <h2 className="text-sm font-bold text-slate-800 px-1">Active Channels & Communities</h2>
            {channels.map((ch) => {
              const active = ch.id === selectedChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-colors ${
                    active
                      ? 'bg-amber-50 border-amber-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{ch.name}</p>
                    <span className="text-[11px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg">
                      Up to {Number(ch.maxMembers || 200000).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{ch.description}</p>
                </button>
              );
            })}
            {channels.length === 0 && (
              <p className="text-sm text-slate-500 p-2">No channels yet. Tap "New Channel or Group" above!</p>
            )}
          </aside>

          {/* Main Broadcast & Tools Area */}
          <section className="lg:col-span-8 space-y-4">
            {currentChannel ? (
              <>
                <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{currentChannel.name}</h2>
                      <p className="text-xs text-slate-600">{currentChannel.description}</p>
                    </div>
                    <span className="text-xs font-semibold bg-white border border-amber-200 text-amber-900 px-3 py-1 rounded-xl">
                      {currentChannel.kind || 'Public Channel'}
                    </span>
                  </div>

                  {currentChannel.pinnedMessage && (
                    <div className="p-3 rounded-2xl bg-white border border-amber-200 flex items-center gap-2 text-xs text-slate-800">
                      <Pin className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Pinned:</strong> {currentChannel.pinnedMessage}
                      </span>
                    </div>
                  )}
                </div>

                {/* Messages & Polls Stream */}
                <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3 max-h-[420px] overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {m.ownerName || m.authorName} ·{' '}
                          <span className="text-amber-700 uppercase">{m.msgKind || 'update'}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{formatRelativeTime(m.createdAt)}</span>
                          <button
                            onClick={() => efadoNexusApi.assembly.pinMessage(currentChannel.id, m.id, m.content)}
                            className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
                          >
                            <Pin className="w-3.5 h-3.5" />
                            <span>Pin</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{m.content}</p>

                      {m.fileUrl && (
                        <a
                          href={m.fileUrl}
                          download={m.fileName || 'assembly-file'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          <FileText className="w-4 h-4 text-amber-600" />
                          <span>Download {m.fileName || 'Attachment'}</span>
                        </a>
                      )}

                      {m.poll && Array.isArray(m.poll.options) && (
                        <div className="space-y-1.5 pt-1">
                          {m.poll.options.map((opt: any, idx: number) => {
                            const votes = Array.isArray(opt.votes) ? opt.votes : [];
                            const voted = votes.includes(user.uid);
                            return (
                              <button
                                key={idx}
                                onClick={() =>
                                  efadoNexusApi.assembly
                                    .voteChannelPoll(user, m.id, m.poll, idx)
                                    .catch((e) => setFeedback(e.message))
                                }
                                className={`w-full min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                                  voted
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-slate-800 border-slate-200'
                                }`}
                              >
                                <span>{opt.label}</span>
                                <span>{votes.length} votes</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-center py-8 text-sm text-slate-500">
                      No announcements or polls yet in this channel. Post one below!
                    </p>
                  )}
                </div>

                {/* Broadcast / Poll Composer */}
                <form onSubmit={handleSendToChannel} className="p-4 rounded-3xl bg-sky-50 border border-sky-200 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'announcement', label: 'Announcement', icon: Megaphone },
                      { id: 'message', label: 'Discussion', icon: Users },
                      { id: 'poll', label: 'Poll', icon: Vote },
                    ].map((k) => {
                      const Icon = k.icon;
                      return (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => setMsgKind(k.id as any)}
                          className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                            msgKind === k.id
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-slate-700 border-sky-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{k.label}</span>
                        </button>
                      );
                    })}
                    <label className="min-h-[38px] px-3 py-1 rounded-xl bg-white border border-sky-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer ml-auto">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Share File</span>
                      <input type="file" className="hidden" onChange={handleFileAttach} />
                    </label>
                  </div>

                  {msgKind === 'poll' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={pollOpt1}
                        onChange={(e) => setPollOpt1(e.target.value)}
                        placeholder="Poll choice 1"
                        className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                      />
                      <input
                        type="text"
                        value={pollOpt2}
                        onChange={(e) => setPollOpt2(e.target.value)}
                        placeholder="Poll choice 2"
                        className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder={msgKind === 'poll' ? 'Write your poll question...' : 'Write an announcement or update...'}
                      className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>

                {/* Admin Tools & Automated Channel Assistant */}
                <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>Channel Admin Tools & Automated Welcome Assistant</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Slow Mode (seconds)</label>
                      <select
                        value={slowMode}
                        onChange={(e) => setSlowMode(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white border border-emerald-200 text-sm"
                      >
                        <option value={0}>Off (0s)</option>
                        <option value={10}>10 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                        <Bot className="w-3.5 h-3.5 text-emerald-700" /> Channel Assistant Welcome Note
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={autoReplyText}
                          onChange={(e) => setAutoReplyText(e.target.value)}
                          placeholder="Automatic welcome note for members..."
                          className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-white border border-emerald-200 text-sm"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await efadoNexusApi.assembly.updateChannelSettings(currentChannel.id, {
                                slowModeSeconds: slowMode,
                                autoResponder: autoReplyText,
                              });
                              setFeedback('Channel settings saved!');
                            } catch (err: any) {
                              setFeedback(err?.message || 'Not sent, please try again.');
                            }
                          }}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                        >
                          Save Tools
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                Select or create a channel on the left to start broadcasting.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
