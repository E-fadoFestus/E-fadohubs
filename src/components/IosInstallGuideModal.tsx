import React from 'react';
import { motion } from 'motion/react';
import { X, Share2, Smartphone } from 'lucide-react';

interface IosInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallGuideModal: React.FC<IosInstallGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        id="ios-install-backdrop"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative z-10 overflow-hidden"
        id="ios-install-modal"
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          id="ios-install-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Install EFADO Hubs</h3>
            <p className="text-xs text-slate-400">Add EFADO to your iOS Home Screen in seconds</p>
          </div>
        </div>

        {/* Content / Steps */}
        <div className="space-y-6 text-left">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-bold">
              1
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Open Safari browser</p>
              <p className="text-xs text-slate-400 mt-0.5">Please verify you are viewing this app directly in Safari, as other browsers do not support adding apps to the iOS Home Screen.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-bold">
              2
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                Tap the Share icon <Share2 className="w-4 h-4 text-indigo-400 inline" />
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Look for the share button in Safari's bottom toolbar (on iPhones) or top toolbar (on iPads).</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-bold">
              3
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Select "Add to Home Screen"</p>
              <p className="text-xs text-slate-400 mt-0.5">Scroll down the options menu and select the <strong className="text-indigo-400">"Add to Home Screen"</strong> option, then tap "Add" in the top-right corner.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            📱 Enjoy Native App features & Offline access!
          </p>
        </div>
      </motion.div>
    </div>
  );
};
