import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, MessageCircle, Lightbulb } from 'lucide-react';
import { HUB_GUIDES, HubGuideId } from '../data/hubGuides';
import { getGuideHubLaunch, openSupportHelpForm } from '../utils/helpSupport';

interface HubGuideNoteProps {
  guideId: HubGuideId;
  variant?: 'dark' | 'light';
  defaultOpenDesktop?: boolean;
  className?: string;
}

export const HubGuideNote: React.FC<HubGuideNoteProps> = ({
  guideId,
  variant = 'dark',
  defaultOpenDesktop = false,
  className = ''
}) => {
  const guide = HUB_GUIDES[guideId];

  // Collapse by default on phones (< 768px) so primary controls are never blocked.
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return defaultOpenDesktop && window.innerWidth >= 768;
  });

  if (!guide) return null;

  const isDark = variant === 'dark';

  const handleOpenHelpChat = () => {
    openSupportHelpForm(getGuideHubLaunch(guideId));
  };

  return (
    <section
      aria-label={guide.title}
      className={`rounded-2xl border transition-colors ${
        isDark
          ? 'bg-slate-900/90 border-slate-700/80 text-slate-100'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      } ${className}`}
    >
      {/* Compact Header Row — Always Visible, Never Blocks Action Buttons */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300'
                : 'bg-indigo-100 border-indigo-200 text-indigo-700'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h3
              className={`text-sm sm:text-base font-bold leading-snug ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}
            >
              {guide.title}
            </h3>
            <p
              className={`text-xs sm:text-sm leading-relaxed mt-0.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <span className="font-semibold">What is this?</span> {guide.whatIsThis}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
            isDark
              ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/40 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700 text-white'
          }`}
        >
          <span>{isOpen ? 'Hide Guide' : 'Show Guide'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </button>
      </div>

      {/* Expandable Step-by-Step Body */}
      {isOpen && (
        <div
          className={`px-3.5 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 border-t space-y-4 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          {/* What to do */}
          <div>
            <p
              className={`text-xs sm:text-sm font-bold uppercase tracking-wide mb-2.5 ${
                isDark ? 'text-indigo-300' : 'text-indigo-700'
              }`}
            >
              What to do:
            </p>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {guide.steps.map((stepText, idx) => (
                <li
                  key={idx}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm leading-relaxed ${
                    isDark
                      ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isDark
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-normal">
                    <strong className={isDark ? 'text-white' : 'text-slate-950'}>
                      Step {idx + 1}:
                    </strong>{' '}
                    {stepText}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* What happens next + Example */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className={`p-3.5 rounded-xl border text-sm leading-relaxed ${
                isDark
                  ? 'bg-emerald-950/35 border-emerald-500/30 text-emerald-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                  isDark ? 'text-emerald-300' : 'text-emerald-800'
                }`}
              >
                What happens next?
              </p>
              <p>{guide.whatHappensNext}</p>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-sm leading-relaxed ${
                isDark
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-100'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-amber-300' : 'text-amber-800'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                Example:
              </p>
              <p>{guide.example}</p>
            </div>
          </div>

          {/* Need Help Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Stuck on any step? Message our support desk directly.
            </p>
            <button
              type="button"
              onClick={handleOpenHelpChat}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Need Help? Chat Us</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
