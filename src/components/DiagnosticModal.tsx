import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Server, Globe, Shield, Database } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { NEW_BACKEND_URL, NEW_PROJECT_ID, getBackendUrl } from '../config/backend';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Hostname & Location Info
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  const href = typeof window !== 'undefined' ? window.location.href : 'unknown';
  const port = typeof window !== 'undefined' ? window.location.port || '(default 80/443)' : 'unknown';

  // 2. Env values containing FIREBASE, API_URL, PROJECT_ID, HOSTING (plus all import.meta.env)
  const envEntries: Record<string, any> = {};
  try {
    const metaEnv = import.meta.env || {};
    Object.keys(metaEnv).forEach((k) => {
      envEntries[k] = metaEnv[k];
    });
  } catch (e) {
    envEntries['error_reading_meta_env'] = String(e);
  }

  // Filtered keys requested
  const filteredEnv: Record<string, any> = {};
  Object.keys(envEntries).forEach((k) => {
    const upper = k.toUpperCase();
    if (
      upper.includes('FIREBASE') ||
      upper.includes('API_URL') ||
      upper.includes('PROJECT_ID') ||
      upper.includes('HOSTING') ||
      upper.includes('FLUTTERWAVE') ||
      upper.includes('OPAY')
    ) {
      filteredEnv[k] = envEntries[k];
    }
  });

  // 3. Firebase config object
  const fbConfig = {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    firestoreDatabaseId: (firebaseConfig as any).firestoreDatabaseId || '(default)',
    appId: firebaseConfig.appId,
    apiKey: firebaseConfig.apiKey,
    messagingSenderId: firebaseConfig.messagingSenderId,
    oAuthClientId: firebaseConfig.oAuthClientId,
    recaptchaSiteKey: firebaseConfig.recaptchaSiteKey || '(none)',
  };

  // 4. Backend API Base URL and Endpoints
  const apiBaseUrl = NEW_BACKEND_URL;
  const backendEndpoints = {
    baseUrl: apiBaseUrl,
    opayInitialize: getBackendUrl('/api/opay/initialize'),
    opayStatus: getBackendUrl('/api/opay/status/[reference]'),
    flutterwaveInitialize: getBackendUrl('/api/flutterwave/initialize'),
    flutterwaveSubaccount: getBackendUrl('/api/flutterwave/subaccount'),
    verifyBank: getBackendUrl('/api/verify-bank'),
    firebaseFunction_createFlutterwavePayment: `https://us-central1-${NEW_PROJECT_ID}.cloudfunctions.net/createFlutterwavePayment`,
    firebaseFunction_initializeOpayPayment: `https://us-central1-${NEW_PROJECT_ID}.cloudfunctions.net/initializeOpayPayment`,
    firebaseFunction_opayWebhook: `https://us-central1-${NEW_PROJECT_ID}.cloudfunctions.net/opayWebhook`,
  };

  // 5. Target Hosting Project Name
  const targetHostingProject = firebaseConfig.projectId || 'efado-market-hubs-8leju';
  const defaultFirebaseRcProject = 'efado-market-hubs-8leju';

  // 6. firebase.json hosting config
  const firebaseJsonHosting = {
    hosting: {
      public: "dist",
      ignore: [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      rewrites: [
        {
          "source": "/api/**",
          "function": "api"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    functions: [
      {
        "source": "functions",
        "codebase": "default",
        "ignore": [
          "node_modules",
          ".git",
          "firebase-debug.log",
          "firebase-debug.*.log",
          "*.local"
        ]
      }
    ],
    firestore: {
      "rules": "firestore.rules"
    }
  };

  // Plain-text full report for instant copy
  const fullReportText = `=== EFADO ECOSYSTEM SYSTEM DIAGNOSIS ===
Timestamp: ${new Date().toISOString()}

1. HOSTNAME & LOCATION:
- window.location.hostname: ${hostname}
- window.location.origin: ${origin}
- window.location.port: ${port}
- window.location.href: ${href}

2. ENVIRONMENT VARIABLES (import.meta.env):
Filtered (FIREBASE, API_URL, PROJECT_ID, HOSTING, FLUTTERWAVE, OPAY):
${JSON.stringify(filteredEnv, null, 2)}

All Available import.meta.env Keys:
${JSON.stringify(envEntries, null, 2)}

3. FIREBASE CONFIG OBJECT:
- projectId: ${fbConfig.projectId}
- authDomain: ${fbConfig.authDomain}
- storageBucket: ${fbConfig.storageBucket}
- firestoreDatabaseId: ${fbConfig.firestoreDatabaseId}
- appId: ${fbConfig.appId}
- apiKey: ${fbConfig.apiKey}
- messagingSenderId: ${fbConfig.messagingSenderId}
- oAuthClientId: ${fbConfig.oAuthClientId}

Raw firebaseConfig:
${JSON.stringify(firebaseConfig, null, 2)}

4. BACKEND API URLS:
- Base URL: ${backendEndpoints.baseUrl}
- OPay Initialize: ${backendEndpoints.opayInitialize}
- OPay Status: ${backendEndpoints.opayStatus}
- Flutterwave Initialize: ${backendEndpoints.flutterwaveInitialize}
- Flutterwave Subaccount: ${backendEndpoints.flutterwaveSubaccount}
- Bank Verification: ${backendEndpoints.verifyBank}
- Cloud Function Flutterwave: ${backendEndpoints.firebaseFunction_createFlutterwavePayment}
- Cloud Function OPay: ${backendEndpoints.firebaseFunction_initializeOpayPayment}
- Cloud Function Webhook: ${backendEndpoints.firebaseFunction_opayWebhook}

5. DEPLOYMENT & HOSTING TARGET:
- Configured Project ID: ${targetHostingProject}
- .firebaserc default project: ${defaultFirebaseRcProject}
- Firestore Database: ${fbConfig.firestoreDatabaseId}

6. FIREBASE.JSON CONFIG:
${JSON.stringify(firebaseJsonHosting, null, 2)}
========================================`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullReportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      prompt('Copy diagnostic data:', fullReportText);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-sm font-black text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-amber-400" />
              SYSTEM DIAGNOSIS (RAW PLAIN TEXT)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-colors uppercase text-[11px]"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied All!' : 'Copy All Text'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* 1. Hostname */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Globe className="w-4 h-4" />
              <span>1. window.location.hostname & Origin</span>
            </div>
            <div className="bg-black/60 p-3 rounded-lg border border-white/5 space-y-1 text-slate-300 select-all">
              <div><strong className="text-amber-400">hostname:</strong> {hostname}</div>
              <div><strong className="text-amber-400">origin:</strong> {origin}</div>
              <div><strong className="text-amber-400">port:</strong> {port}</div>
              <div><strong className="text-amber-400">href:</strong> {href}</div>
            </div>
          </section>

          {/* 2. Environment Variables */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Terminal className="w-4 h-4" />
              <span>2. Environment Variables (import.meta.env / process.env)</span>
            </div>
            <div className="text-slate-400 text-[11px]">Filtered for FIREBASE, API_URL, PROJECT_ID, HOSTING, FLUTTERWAVE, OPAY:</div>
            <pre className="bg-black/60 p-3 rounded-lg border border-white/5 text-emerald-300 overflow-x-auto whitespace-pre-wrap select-all">
              {JSON.stringify(filteredEnv, null, 2)}
            </pre>
            <div className="text-slate-400 text-[11px] mt-2">All available keys in import.meta.env:</div>
            <pre className="bg-black/60 p-3 rounded-lg border border-white/5 text-slate-300 overflow-x-auto whitespace-pre-wrap select-all">
              {JSON.stringify(envEntries, null, 2)}
            </pre>
          </section>

          {/* 3. Firebase Config */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>3. firebaseConfig Object (Real Raw Values)</span>
            </div>
            <div className="bg-black/60 p-3 rounded-lg border border-white/5 space-y-1 text-slate-200 select-all">
              <div><strong className="text-amber-300">projectId:</strong> {fbConfig.projectId}</div>
              <div><strong className="text-amber-300">authDomain:</strong> {fbConfig.authDomain}</div>
              <div><strong className="text-amber-300">storageBucket:</strong> {fbConfig.storageBucket}</div>
              <div><strong className="text-amber-300">firestoreDatabaseId:</strong> {fbConfig.firestoreDatabaseId}</div>
              <div><strong className="text-amber-300">appId:</strong> {fbConfig.appId}</div>
              <div><strong className="text-amber-300">apiKey:</strong> {fbConfig.apiKey}</div>
              <div><strong className="text-amber-300">messagingSenderId:</strong> {fbConfig.messagingSenderId}</div>
              <div><strong className="text-amber-300">oAuthClientId:</strong> {fbConfig.oAuthClientId}</div>
            </div>
            <div className="text-slate-400 text-[11px] mt-2">Full JSON:</div>
            <pre className="bg-black/60 p-3 rounded-lg border border-white/5 text-amber-200 overflow-x-auto whitespace-pre-wrap select-all">
              {JSON.stringify(firebaseConfig, null, 2)}
            </pre>
          </section>

          {/* 4. Backend API Base URL and Endpoints */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Server className="w-4 h-4" />
              <span>4. Full Backend API Base URLs & Endpoints</span>
            </div>
            <div className="bg-black/60 p-3 rounded-lg border border-white/5 space-y-1.5 text-slate-200 select-all">
              <div><strong className="text-sky-300">Base URL:</strong> {backendEndpoints.baseUrl}</div>
              <div><strong className="text-sky-300">OPay Initialize:</strong> {backendEndpoints.opayInitialize}</div>
              <div><strong className="text-sky-300">OPay Status:</strong> {backendEndpoints.opayStatus}</div>
              <div><strong className="text-sky-300">Flutterwave Initialize:</strong> {backendEndpoints.flutterwaveInitialize}</div>
              <div><strong className="text-sky-300">Flutterwave Subaccount:</strong> {backendEndpoints.flutterwaveSubaccount}</div>
              <div><strong className="text-sky-300">Verify Bank:</strong> {backendEndpoints.verifyBank}</div>
              <div className="pt-2 text-slate-400">Callable Firebase Cloud Functions:</div>
              <div><strong className="text-purple-300">Flutterwave CF:</strong> {backendEndpoints.firebaseFunction_createFlutterwavePayment}</div>
              <div><strong className="text-purple-300">OPay CF:</strong> {backendEndpoints.firebaseFunction_initializeOpayPayment}</div>
              <div><strong className="text-purple-300">OPay Webhook CF:</strong> {backendEndpoints.firebaseFunction_opayWebhook}</div>
            </div>
          </section>

          {/* 5. Hosting Project Target */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>5. Hosting Project Name Deploying To</span>
            </div>
            <div className="bg-black/60 p-3 rounded-lg border border-white/5 space-y-1 text-slate-200 select-all">
              <div><strong className="text-pink-300">Configured Firebase Project:</strong> {targetHostingProject}</div>
              <div><strong className="text-pink-300">.firebaserc Default Project:</strong> {defaultFirebaseRcProject}</div>
              <div><strong className="text-pink-300">Applet ID:</strong> ae55e9a4-6837-4ca3-a2d6-3ec7ce41d18a</div>
              <div><strong className="text-pink-300">Firestore DB ID:</strong> {fbConfig.firestoreDatabaseId}</div>
            </div>
          </section>

          {/* 6. firebase.json hosting config */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
              <Terminal className="w-4 h-4" />
              <span>6. firebase.json Hosting Config</span>
            </div>
            <pre className="bg-black/60 p-3 rounded-lg border border-white/5 text-yellow-200 overflow-x-auto whitespace-pre-wrap select-all">
              {JSON.stringify(firebaseJsonHosting, null, 2)}
            </pre>
          </section>

          {/* Bottom Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Full Diagnostic Text'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
