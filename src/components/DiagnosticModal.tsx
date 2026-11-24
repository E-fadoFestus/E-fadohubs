import React, { useState } from 'react';
import { X, Copy, Check, Server, Globe, Shield, Database, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { NEW_BACKEND_URL, NEW_PROJECT_ID, getBackendUrl } from '../config/backend';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  const port = typeof window !== 'undefined' ? window.location.port || 'Default (80/443)' : 'unknown';

  const metaEnv: Record<string, unknown> = (() => {
    try {
      return (import.meta as any).env || {};
    } catch {
      return {};
    }
  })();

  const isConfigured = (val: unknown) =>
    typeof val === 'string' && val.trim().length > 0;

  // Boolean-only health checks — never print raw keys or env values in the browser
  const envChecks = [
    {
      label: 'Firebase API Key',
      configured: isConfigured((firebaseConfig as any).apiKey) || isConfigured(metaEnv.VITE_FIREBASE_API_KEY),
      detail: 'Redacted for browser safety',
    },
    {
      label: 'Firebase Project ID',
      configured: isConfigured(firebaseConfig.projectId),
      detail: firebaseConfig.projectId || 'Not set',
    },
    {
      label: 'OAuth Client',
      configured: isConfigured((firebaseConfig as any).oAuthClientId),
      detail: isConfigured((firebaseConfig as any).oAuthClientId) ? 'Configured (Redacted)' : 'Not set',
    },
    {
      label: 'App Check / reCAPTCHA',
      configured: isConfigured((firebaseConfig as any).recaptchaSiteKey),
      detail: isConfigured((firebaseConfig as any).recaptchaSiteKey) ? 'Configured (Redacted)' : 'Not configured',
    },
    {
      label: 'Backend API Origin',
      configured: isConfigured(NEW_BACKEND_URL),
      detail: NEW_BACKEND_URL || 'Relative same-origin (/api/*)',
    },
    {
      label: 'Flutterwave Public Key Env',
      configured: isConfigured(metaEnv.VITE_FLUTTERWAVE_PUBLIC_KEY),
      detail: isConfigured(metaEnv.VITE_FLUTTERWAVE_PUBLIC_KEY) ? 'Configured via Env (Redacted)' : 'Using standard runtime config',
    },
    {
      label: 'Paystack Public Env',
      configured: isConfigured(metaEnv.VITE_PAYSTACK_PUBLIC_KEY),
      detail: isConfigured(metaEnv.VITE_PAYSTACK_PUBLIC_KEY) ? 'Configured via Env (Redacted)' : 'Managed server-side',
    },
  ];

  const safeProjectSummary = {
    projectId: firebaseConfig.projectId || NEW_PROJECT_ID,
    authDomain: firebaseConfig.authDomain || 'Not set',
    storageBucket: firebaseConfig.storageBucket || 'Not set',
    firestoreDatabaseId: (firebaseConfig as any).firestoreDatabaseId || '(default)',
    apiKey: '[REDACTED]',
    appId: '[REDACTED]',
    oAuthClientId: '[REDACTED]',
  };

  const backendEndpoints = {
    baseUrl: NEW_BACKEND_URL || '(same origin)',
    opayInitialize: getBackendUrl('/api/opay/initialize'),
    opayStatus: getBackendUrl('/api/opay/status/[reference]'),
    flutterwaveInitialize: getBackendUrl('/api/flutterwave/initialize'),
    flutterwaveSubaccount: getBackendUrl('/api/flutterwave/subaccount'),
    verifyBank: getBackendUrl('/api/verify-bank'),
    cloudFunctionsRegion: `us-central1 (${NEW_PROJECT_ID})`,
  };

  const redactedSummaryText = [
    '=== EFADO SYSTEM HEALTH SUMMARY (REDACTED - CEO ONLY) ===',
    `Checked At: ${new Date().toISOString()}`,
    `Mode: ${metaEnv.PROD ? 'Production' : 'Development'}`,
    '',
    '1. HOST & ORIGIN:',
    `- Hostname: ${hostname}`,
    `- Origin: ${origin}`,
    `- Port: ${port}`,
    '',
    '2. CONFIGURATION CHECKS (VALUES REDACTED):',
    ...envChecks.map((c) => `- ${c.label}: ${c.configured ? 'OK' : 'Not set'} (${c.detail})`),
    '',
    '3. FIREBASE PROJECT SUMMARY:',
    `- Project ID: ${safeProjectSummary.projectId}`,
    `- Auth Domain: ${safeProjectSummary.authDomain}`,
    `- Storage Bucket: ${safeProjectSummary.storageBucket}`,
    `- Firestore DB: ${safeProjectSummary.firestoreDatabaseId}`,
    '- API Key: [REDACTED]',
    '- App ID: [REDACTED]',
    '- OAuth Client ID: [REDACTED]',
    '',
    '4. API ENDPOINTS:',
    `- Base URL: ${backendEndpoints.baseUrl}`,
    `- Verify Bank: ${backendEndpoints.verifyBank}`,
    `- Cloud Functions: ${backendEndpoints.cloudFunctionsRegion}`,
    '======================================================',
  ].join('\n');

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(redactedSummaryText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        setCopied(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-sm text-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-white/10 shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                System Health &amp; Diagnostics
              </h2>
              <p className="text-xs text-slate-400 truncate">
                CEO-only view • Sensitive keys and environment values are hidden
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Close diagnostics"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* 1. Hostname & Runtime */}
          <section className="bg-slate-950/70 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Globe className="w-4 h-4" />
              <span>1. Host &amp; Runtime Mode</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-0.5">Hostname</span>
                <span className="text-white font-mono break-all">{hostname}</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-0.5">Origin</span>
                <span className="text-white font-mono break-all">{origin}</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-0.5">Port</span>
                <span className="text-white font-mono">{port}</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-0.5">Build Mode</span>
                <span className="text-emerald-400 font-semibold">
                  {metaEnv.PROD ? 'Production' : 'Development'}
                </span>
              </div>
            </div>
          </section>

          {/* 2. Redacted Configuration Checks */}
          <section className="bg-slate-950/70 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Shield className="w-4 h-4" />
              <span>2. Configuration Status (Secrets Hidden)</span>
            </div>
            <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-slate-900/60">
              {envChecks.map((check) => (
                <div key={check.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{check.label}</p>
                    <p className="text-slate-400 truncate">{check.detail}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold shrink-0 ${
                      check.configured
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {check.configured ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Configured</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Not Set</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Firebase Project Metadata (Safe) */}
          <section className="bg-slate-950/70 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Database className="w-4 h-4" />
              <span>3. Firebase Project Summary</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 font-sans block mb-0.5">Project ID</span>
                <span className="text-white break-all">{safeProjectSummary.projectId}</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 font-sans block mb-0.5">Auth Domain</span>
                <span className="text-white break-all">{safeProjectSummary.authDomain}</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 font-sans block mb-0.5">Firestore DB</span>
                <span className="text-white break-all">{safeProjectSummary.firestoreDatabaseId}</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 font-sans block mb-0.5">API Key / App ID / OAuth</span>
                <span className="text-slate-400">[REDACTED FOR SECURITY]</span>
              </div>
            </div>
          </section>

          {/* 4. Backend API Endpoints */}
          <section className="bg-slate-950/70 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <Server className="w-4 h-4" />
              <span>4. Backend API Routes</span>
            </div>
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-white/5 space-y-1.5 text-xs font-mono text-slate-300">
              <div><span className="text-sky-300">Base URL:</span> {backendEndpoints.baseUrl}</div>
              <div><span className="text-sky-300">OPay Initialize:</span> {backendEndpoints.opayInitialize}</div>
              <div><span className="text-sky-300">OPay Status:</span> {backendEndpoints.opayStatus}</div>
              <div><span className="text-sky-300">Flutterwave Initialize:</span> {backendEndpoints.flutterwaveInitialize}</div>
              <div><span className="text-sky-300">Bank Verification:</span> {backendEndpoints.verifyBank}</div>
              <div><span className="text-sky-300">Cloud Functions:</span> {backendEndpoints.cloudFunctionsRegion}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
