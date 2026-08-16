import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  Info, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface AdSenseBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'horizontal' | 'rectangle';
  layoutKey?: string;
  className?: string;
  label?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  minHeight?: number;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slot,
  format = 'auto',
  layoutKey,
  className = '',
  label = 'Sponsored Partner Advertisement',
  collapsible = true,
  defaultCollapsed = false,
  minHeight = 90
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const adPushedRef = useRef(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // Only attempt to push the ad once per mount to prevent multiple push errors
    if (!adPushedRef.current && !isCollapsed) {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adPushedRef.current = true;
          setIsAdLoaded(true);
        }
      } catch (err) {
        // Adsbygoogle can catch gracefully if an ad blocker or sandbox is active
        console.debug('AdSense placement initialization info:', err);
      }
    }
  }, [isCollapsed]);

  return (
    <div 
      ref={adRef} 
      className={`my-6 mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 ${className}`}
      id={`adsense-wrapper-${slot || 'auto'}`}
    >
      {/* Top Non-Obtrusive Header Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/60 border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400/90 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            {label}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-white/5 text-slate-400 border border-white/5">
            AdSense Safe
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy & Safe Ads Info Trigger */}
          <button
            type="button"
            onClick={() => setShowInfoModal(!showInfoModal)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors text-[9px] flex items-center gap-1"
            title="Ad Transparency & Privacy"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[9px] font-semibold text-slate-400">Ad Info</span>
          </button>

          {/* Show / Hide / Minimize Toggle */}
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[9px] font-bold uppercase tracking-wider border border-white/5 active:scale-95"
              title={isCollapsed ? "Expand Advertisement" : "Minimize Advertisement"}
            >
              {isCollapsed ? (
                <>
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span>Show Sponsor</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 text-slate-400" />
                  <span>Hide / Minimize</span>
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info Popover / Modal Overlay */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-slate-950 border-b border-indigo-500/20 text-left text-xs text-slate-300 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Google AdSense Publisher Integrity
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Advertisements displayed here are served securely through verified Google AdSense partner networks. Ads support free educational tools, marketplace features, and community services on EFADO.
            </p>
            <div className="flex items-center justify-between pt-1 text-[9px] text-slate-500">
              <span>Publisher ID: <code className="text-indigo-300 font-mono">ca-pub-8208284846339791</code></span>
              <a 
                href="https://policies.google.com/technologies/ads" 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                Google Ad Policies <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Ad Container with Collapse Animation */}
      <AnimatePresence initial={false}>
        {!isCollapsed ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-3 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ minHeight: `${minHeight}px` }}
          >
            {/* Google AdSense ins element */}
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: `${minHeight}px` }}
              data-ad-client="ca-pub-8208284846339791"
              {...(slot ? { 'data-ad-slot': slot } : {})}
              data-ad-format={format}
              data-full-width-responsive="true"
              {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
            />

            {/* Subtle background placeholder watermark so there are no awkward blank layout shifts */}
            <div className="w-full py-4 text-center text-[10px] text-slate-500/60 font-medium flex items-center justify-center gap-2 select-none pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-400/50" />
              <span>EFADO Verified Sponsor Network</span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2 bg-slate-950/30 cursor-pointer hover:text-slate-300"
            onClick={() => setIsCollapsed(false)}
          >
            <Eye className="w-3 h-3 text-slate-400" />
            <span>Advertisement minimized for distraction-free browsing. Tap <strong className="text-slate-300 underline font-bold">Show Sponsor</strong> to view.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
