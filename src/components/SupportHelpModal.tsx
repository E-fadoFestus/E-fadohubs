import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Send, HelpCircle, Loader2 } from 'lucide-react';
import { addDoc, auth, collection, db, serverTimestamp } from '../firebase';
import { UserProfile } from '../types';
import {
  SUPPORT_SUBJECT_OPTIONS,
  SupportSubject,
  subscribeSupportHelpModal,
} from '../utils/helpSupport';

interface SupportHelpModalProps {
  user: UserProfile | null;
}

const OperationType = {
  CREATE: 'create',
} as const;

function logSupportFirestoreError(error: unknown, path: string) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const info = {
    error: errMessage,
    operationType: OperationType.CREATE,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
  };
  console.error('SupportHelpModal Firestore Error:', JSON.stringify(info));
}

export const SupportHelpModal: React.FC<SupportHelpModalProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hub, setHub] = useState('General Support');
  const [subject, setSubject] = useState<SupportSubject>('Payment Issue');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resolveAutoName = () =>
    user?.fullName?.trim() ||
    user?.displayName?.trim() ||
    user?.accountName?.trim() ||
    user?.email?.split('@')[0] ||
    '';

  const resolveAutoPhone = () =>
    user?.phoneNumber?.trim() ||
    user?.admin_otp_phone?.trim() ||
    user?.mobileMoneyNumber?.trim() ||
    '';

  useEffect(() => {
    const unsubscribe = subscribeSupportHelpModal(({ hub: launchHub, subject: launchSubject }) => {
      setName(resolveAutoName());
      setPhone(resolveAutoPhone());
      setHub(launchHub || 'General Support');
      setSubject(launchSubject || 'Payment Issue');
      setMessage('');
      setErrorMsg(null);
      setIsSubmitted(false);
      setIsOpen(true);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting]);

  const handleClose = () => {
    if (submitting) return;
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedHub = hub.trim() || 'General Support';
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!trimmedMessage) {
      setErrorMsg('Please write a short message describing how we can help.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'help_inbox'), {
        userId: user?.uid || auth.currentUser?.uid || 'guest',
        userEmail: user?.email || auth.currentUser?.email || '',
        userName: trimmedName,
        phone: trimmedPhone,
        hub: trimmedHub,
        subject,
        message: trimmedMessage,
        status: 'New',
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString(),
      });

      setIsSubmitted(true);
      setMessage('');
    } catch (err: any) {
      logSupportFirestoreError(err, 'help_inbox');
      setErrorMsg(
        err?.message?.includes('permission')
          ? 'Could not send right now due to permissions. Please sign in or try again.'
          : 'Could not send your message. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-help-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 my-auto"
          >
            {/* Header */}
            <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 id="support-help-modal-title" className="text-base font-bold text-white truncate">
                    Need Help? Message Support
                  </h2>
                  <p className="text-xs text-slate-400 truncate">
                    Direct ticket to EFADO Support Desk
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                aria-label="Close Support Form"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {isSubmitted ? (
              <div className="p-5 sm:p-6 space-y-5 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-base font-bold text-white leading-snug">
                    Your message has been sent. Our team will contact you shortly.
                  </p>
                  <p className="text-xs text-slate-400">
                    Hub: <span className="text-slate-200 font-semibold">{hub}</span> · Subject:{' '}
                    <span className="text-slate-200 font-semibold">{subject}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-left">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="support-name" className="block text-xs font-semibold text-slate-300">
                      Name
                    </label>
                    <input
                      id="support-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      maxLength={120}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="support-phone" className="block text-xs font-semibold text-slate-300">
                      Phone
                    </label>
                    <input
                      id="support-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="080..."
                      maxLength={40}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="support-hub" className="block text-xs font-semibold text-slate-300">
                      Hub
                    </label>
                    <input
                      id="support-hub"
                      type="text"
                      value={hub}
                      onChange={(e) => setHub(e.target.value)}
                      required
                      maxLength={120}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="support-subject" className="block text-xs font-semibold text-slate-300">
                      Subject
                    </label>
                    <select
                      id="support-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value as SupportSubject)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {SUPPORT_SUBJECT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="support-message" className="block text-xs font-semibold text-slate-300">
                    Message
                  </label>
                  <textarea
                    id="support-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us clearly what happened (include amount or reference if it is a payment or withdrawal issue)..."
                    required
                    maxLength={3000}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-y"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 shrink-0" />
                        <span>Send to Support</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
