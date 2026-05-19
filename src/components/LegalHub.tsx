import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  FileText, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Lock,
  UserCheck,
  Building2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LegalHubProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: 'TERMS' | 'PRIVACY' | 'GAMING' | 'DISCLAIMER';
}

export const LegalHub: React.FC<LegalHubProps> = ({ isOpen, onClose, initialSection = 'TERMS' }) => {
  const [activeTab, setActiveTab] = useState(initialSection);

  const sections = [
    { id: 'TERMS', label: 'Terms of Service', icon: FileText },
    { id: 'PRIVACY', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'GAMING', label: 'Gaming Policy', icon: Scale },
    { id: 'DISCLAIMER', label: 'Disclaimers', icon: AlertTriangle },
  ];

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <header className="p-8 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Compliance & Legal Hub</h2>
              <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">EFADO Strategic Operational Manual</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <nav className="w-64 border-r border-gray-100 p-6 space-y-2 bg-gray-50/50">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id as any)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeTab === section.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-gray-700 hover:bg-white hover:text-gray-900'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}

            <div className="mt-auto pt-8">
              <div className="p-5 bg-white border border-gray-100 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Building2 className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Business ID</span>
                </div>
                <p className="text-[9px] font-bold text-gray-700 leading-relaxed uppercase tracking-tight">
                  Reg: [BUSINESS_REGISTRATION_NUMBER]<br />
                  Entity: EFADO GLOBAL CONNECTS
                </p>
              </div>
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-3xl space-y-12">
              {activeTab === 'TERMS' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <header>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">Terms of Service</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Last Updated: May 2024</p>
                  </header>

                  <div className="space-y-6">
                    <LegalSection title="1. Acceptance of Terms">
                      By accessing EFADO (the "Platform"), you agree to be bound by these strategic operational protocols. If you do not agree with any part, you must immediately cease deployments within our network.
                    </LegalSection>

                    <LegalSection title="2. Account Integrity">
                      Users are responsible for maintaining the military-grade security of their credentials. You must provide true, accurate business registration details where required. Fake identities will result in permanent blacklisting.
                    </LegalSection>

                    <LegalSection title="3. Financial Transactions">
                      All deposits, withdrawals, and CSCC (Community Savings) participations are logged on the EFADO ledger. We employ AML (Anti-Money Laundering) checks on all high-volume transactions.
                    </LegalSection>

                    <LegalSection title="4. Prohibited Actions">
                      Abuse of system logic, multi-accounting in a single game, or harassment of EFADO Service Corps members is strictly prohibited and subject to legal action under local jurisdiction.
                    </LegalSection>
                  </div>
                </div>
              )}

              {activeTab === 'PRIVACY' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <header>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">Privacy Protocol</h3>
                    <p className="text-gray-500 text-sm leading-relaxed text-indigo-600 font-bold italic underline">We value your business data sovereignty.</p>
                  </header>

                  <div className="space-y-6">
                    <LegalSection title="Information Collection">
                      We collect tactical data including your business email, WhatsApp contact, and registration ID to facilitate secure commerce and communication between vendors and patrons.
                    </LegalSection>

                    <LegalSection title="Data Encryption">
                      All PI (Personal Information) is encrypted at rest using AES-256 protocols. We do not sell user data to third-party marketing entities.
                    </LegalSection>

                    <LegalSection title="Communication">
                      By registering, you agree to receive system-critical updates via email and WhatsApp. You may opt-out of marketing communications but not operational alerts.
                    </LegalSection>
                  </div>
                </div>
              )}

              {activeTab === 'GAMING' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">Gaming Arena Compliance</h3>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <UserCheck className="w-3 h-3" /> Mandatory 18+ Verification
                      </div>
                    </div>
                  </header>

                  <div className="space-y-8">
                    <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2rem] space-y-4">
                      <div className="flex items-center gap-3 text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                        <h4 className="text-sm font-black uppercase tracking-widest">Nigerian Gaming Regulatory Notice</h4>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed font-bold">
                        In accordance with the National Lottery Regulatory Commission (NLRC) of Nigeria, all participants in the EFADO Gaming Arena (Lucky Spin, DMT, Raffle draws) MUST be 18 years or older. Participating under-age is a violation of federal law and our platform protocols.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-gray-100">
                        <h5 className="text-[11px] font-black uppercase tracking-widest mb-3">Provably Fair</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Every spin and shuffle is governed by transparency-backed algorithms. We do not manipulate outcome arrays.</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-gray-100">
                        <h5 className="text-[11px] font-black uppercase tracking-widest mb-3">Responsible Play</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Users are encouraged to set limits. Gaming should remain a strategic diversion, not a liability.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'DISCLAIMER' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <header>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">Strategic Disclaimers</h3>
                  </header>

                  <div className="space-y-12">
                    <LegalSection title="Financial Services (HEPIHANDS)">
                      EFADO is not a licensed commercial bank. HEPIHANDS is a peer-to-peer and community-backed credit facility. Users participate at their own risk based on community trust scores.
                    </LegalSection>

                    <LegalSection title="Service Corps Disclaimer">
                      We facilitate connections with professional service providers. While we verify basic credentials, final contracts and project executions are between the user and the contractor.
                    </LegalSection>

                    <LegalSection title="Market Value">
                      Product valuations in the Fairly Used and Modern markets are set by independent vendors. EFADO does not guarantee the condition of third-party assets beyond escrow protection.
                    </LegalSection>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
            © 2024 EFADO GLOBAL CONNECTS. ALL RIGHTS RESERVED.
          </p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-gray-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
          >
            Acknowledged
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4" /> {title}
    </h4>
    <p className="text-sm text-gray-600 leading-relaxed font-medium pl-6 border-l-2 border-indigo-50">
      {children}
    </p>
  </div>
);
