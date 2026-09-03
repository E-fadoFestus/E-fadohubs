import React, { useState, useEffect, useRef } from 'react';
import { SubmarinePilot, RadioCommsMessage, DeepSeaCurrency } from '../types';
import { Users, Radio, Award, Send, Trophy, Sparkles } from 'lucide-react';
import { soundManager } from '../services/sound';

interface MultiplayerPanelProps {
  pilots: SubmarinePilot[];
  currencySymbol: string;
  userCallsign: string;
}

const INITIAL_MESSAGES: RadioCommsMessage[] = [
  { id: '1', sender: 'Capt. Nemo', rank: 'Fleet Admiral', text: 'Submersible systems green. Diving to 5000M today!', timestamp: '12:01', badge: '🏆' },
  { id: '2', sender: 'Sonar-Zero', rank: 'Deep Scout', text: 'Huge volatility detected in the Hadal zone, take profit early!', timestamp: '12:02' },
  { id: '3', sender: 'System Alert', text: '🚨 WINNER RAIN: Pilot @AbyssRider just cashed out 14.80x (+₦148,000)!', timestamp: '12:04', isSystemAlert: true },
  { id: '4', sender: 'VortexPilot', rank: 'Commander', text: 'Auto-cashout set to 3.50x. Good luck fleet!', timestamp: '12:05' }
];

export const MultiplayerPanel: React.FC<MultiplayerPanelProps> = ({
  pilots,
  currencySymbol,
  userCallsign,
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'radio' | 'top'>('fleet');
  const [messages, setMessages] = useState<RadioCommsMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'radio') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    soundManager.playClick();
    const newMsg: RadioCommsMessage = {
      id: Math.random().toString(),
      sender: userCallsign || 'Pilot',
      rank: 'Sub Captain',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      badge: '⚡'
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleSendQuick = (text: string) => {
    soundManager.playClick();
    const newMsg: RadioCommsMessage = {
      id: Math.random().toString(),
      sender: userCallsign || 'Pilot',
      rank: 'Sub Captain',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const quickPhrases = ['🚀 Diving Deep!', '🌊 Took Profit!', '⚠️ Hull Critical!', '💎 10X or Nothing!'];

  return (
    <div className="bg-slate-900/90 border-2 border-cyan-500/20 rounded-[2.5rem] p-5 shadow-2xl backdrop-blur-md flex flex-col h-[520px]">
      {/* Tabs Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('fleet');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'fleet'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Live Fleet ({pilots.length})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('radio');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${
              activeTab === 'radio'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Radio Comms</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('top');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'top'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Top Dives</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* FLEET TAB */}
        {activeTab === 'fleet' && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1">
              <span className="col-span-5">Pilot Submersible</span>
              <span className="col-span-3 text-right">Stake</span>
              <span className="col-span-4 text-right">Cashout / Status</span>
            </div>

            {pilots.map((pilot) => (
              <div
                key={pilot.id}
                className={`grid grid-cols-12 items-center p-3 rounded-2xl border transition-all ${
                  pilot.isUser
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Pilot Info */}
                <div className="col-span-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-cyan-400 shrink-0">
                    {pilot.callsign.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-black text-white flex items-center gap-1 truncate">
                      <span>{pilot.callsign}</span>
                      {pilot.isUser && (
                        <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 text-[9px] font-black rounded uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{pilot.rank}</div>
                  </div>
                </div>

                {/* Stake */}
                <div className="col-span-3 text-right font-mono font-bold text-xs text-slate-300">
                  {currencySymbol}{pilot.betAmount.toLocaleString()}
                </div>

                {/* Status / Multiplier / Profit */}
                <div className="col-span-4 text-right">
                  {pilot.status === 'cashed_out' ? (
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black">
                        {pilot.cashoutMultiplier?.toFixed(2)}x
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-400">
                        +{currencySymbol}{(pilot.profit || 0).toLocaleString()}
                      </span>
                    </div>
                  ) : pilot.status === 'crashed' ? (
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">
                      Imploded
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-cyan-400 animate-pulse uppercase tracking-wider flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      In Abyss
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RADIO COMMS TAB */}
        {activeTab === 'radio' && (
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-3 overflow-y-auto no-scrollbar pr-1 flex-1 mb-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-2xl border text-xs ${
                    msg.isSystemAlert
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-white">{msg.sender}</span>
                      {msg.rank && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded-md font-bold">
                          {msg.rank}
                        </span>
                      )}
                      {msg.badge && <span>{msg.badge}</span>}
                    </div>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-300 font-medium leading-relaxed">{msg.text}</p>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Tactical Phrases */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 mb-2">
              {quickPhrases.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => handleSendQuick(phrase)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold shrink-0 transition-all"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Broadcast to ocean fleet..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TOP DIVES TAB */}
        {activeTab === 'top' && (
          <div className="space-y-3">
            {[
              { rank: 1, pilot: 'PoseidonX', multiplier: 248.5, payout: 2485000, date: 'Today' },
              { rank: 2, pilot: 'Nautilus99', multiplier: 94.2, payout: 942000, date: 'Today' },
              { rank: 3, pilot: 'TitaniumJet', multiplier: 62.15, payout: 621500, date: 'Today' },
              { rank: 4, pilot: 'AbyssDiver', multiplier: 45.8, payout: 458000, date: 'Yesterday' },
              { rank: 5, pilot: 'KrakenHunter', multiplier: 32.4, payout: 324000, date: 'Yesterday' }
            ].map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      entry.rank === 1
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : entry.rank === 2
                        ? 'bg-slate-300/20 text-slate-300 border border-slate-400/40'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    }`}
                  >
                    #{entry.rank}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">{entry.pilot}</div>
                    <div className="text-[10px] text-slate-500">{entry.date}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-amber-400">{entry.multiplier}x</div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold">
                    +{currencySymbol}{entry.payout.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
