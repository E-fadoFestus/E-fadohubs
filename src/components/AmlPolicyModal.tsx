import React from 'react';
import { X, ShieldAlert, FileText, CheckCircle, Calendar, FileCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface AmlPolicyModalProps {
  onClose: () => void;
}

export const AmlPolicyModal: React.FC<AmlPolicyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col uppercase text-slate-200"
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-white/5 px-8 py-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-indigo-400 shrink-0" />
            <div>
              <h2 className="text-sm font-black text-white tracking-widest">ANTI-MONEY LAUNDERING (AML) POLICY</h2>
              <p className="text-[9px] text-slate-500 font-bold tracking-wider mt-0.5">EFADO TECHNOLOGY CONNECT SYSTEM SECURITY</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8 overflow-y-auto font-sans leading-relaxed tracking-wide text-xs text-slate-300 normal-case select-text">
          
          {/* Cover card */}
          <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl text-center space-y-4">
            <h1 className="text-xl font-black text-white uppercase tracking-wider">EFADO TECHNOLOGY COMPUTER ENGINEERING AND TRAINING SERVICES</h1>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Trading as: Efado Hubs Connect (e-fado.com)</p>
            <div className="flex flex-wrap justify-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date of Registration: June 9, 2021</span>
              <span className="flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5" /> Policy Effective Date: 2026</span>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">1. POLICY STATEMENT</h3>
            <p className="text-[11px] leading-relaxed text-slate-400">
              EFADO Technology Computer Engineering and Training Services (&quot;EFADO Tech,&quot; &quot;the business,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) &mdash; registered on June 8, 2021 &mdash; is committed to conducting business in full compliance with all applicable anti-money laundering laws and regulations in Nigeria, including the Money Laundering (Prohibition) Act, 2022, and the Central Bank of Nigeria (CBN) AML/CFT regulations. We recognize that our platform, Efado Hubs Connect, serves as a digital ecosystem connecting users across multiple service verticals, and we take seriously our responsibility to prevent our platform from being used for money laundering or terrorist financing activities.
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              This policy outlines the measures, procedures, and controls we have implemented to detect, prevent, and report suspicious activities on our platform.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">2. SCOPE AND APPLICABILITY</h3>
            <p className="text-[11px] text-slate-400">This policy applies to:</p>
            <ul className="list-disc list-inside space-y-2 text-[11px] text-slate-400 pl-2">
              <li>All employees, contractors, and agents of EFADO Tech</li>
              <li>All vendors and service providers operating on the Efado Hubs Connect platform</li>
              <li>All users of the platform across all service verticals including marketplace, job portal, real estate, education, community savings, peer-to-peer lending facilitation, vendor directory, and skill-based challenges</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">3. KEY DEFINITIONS</h3>
            <div className="space-y-3 text-[11px] text-slate-400 pl-2">
              <p><strong className="text-slate-200">Money Laundering:</strong> The process of concealing the origins of illegally obtained money by passing it through legitimate business transactions.</p>
              <p><strong className="text-slate-200">PEP:</strong> Politically Exposed Person &mdash; an individual who holds or has held a prominent public position.</p>
              <p><strong className="text-slate-200">KYC:</strong> Know Your Customer &mdash; the process of verifying the identity of users.</p>
              <p><strong className="text-slate-200">SAR:</strong> Suspicious Activity Report &mdash; a report filed regarding suspicious transactions.</p>
              <p><strong className="text-slate-200">Vendor:</strong> A registered seller or service provider on our marketplace who may offer goods, services, or lending facilities directly to other users. EFADO Tech facilitates the connection but does not act as a lender.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">4. CUSTOMER IDENTIFICATION AND VERIFICATION (KYC)</h3>
            <p className="text-[11px] text-slate-400">We maintain robust KYC procedures for all users registering on Efado Hubs Connect:</p>
            
            <div className="space-y-3 pl-3">
              <p className="font-bold text-slate-200 text-[11px]">4.1 Individual Users:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>Full name, date of birth, and residential address</li>
                <li>Valid government-issued identification (National ID, International Passport, or Driver&apos;s License)</li>
                <li>Phone number and email address verification</li>
                <li>Proof of address (utility bill or bank statement dated within 3 months)</li>
                <li>Biometric verification where applicable</li>
              </ul>

              <p className="font-bold text-slate-200 text-[11px] mt-4">4.2 Vendors and Business Users:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>All individual requirements listed above for the authorized representative</li>
                <li>Certificate of Business Registration or Incorporation (CAC certificate)</li>
                <li>Tax Identification Number (TIN)</li>
                <li>Proof of business address</li>
                <li>List of directors and beneficial owners (for corporate entities)</li>
              </ul>

              <p className="font-bold text-slate-200 text-[11px] mt-4">4.3 Age Verification:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>All users must be at least 18 years of age to use any transactional service on the platform</li>
                <li>Age verification is conducted at registration and reconfirmed for skill-based challenge and tournament participation</li>
                <li>Users found to be under 18 are immediately restricted from transactional services</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">5. RISK ASSESSMENT AND CATEGORIZATION</h3>
            <p className="text-[11px] text-slate-400">We implement a risk-based approach to customer due diligence:</p>
            <div className="space-y-3 pl-3">
              <p><strong className="text-slate-200">5.1 Low-Risk Users:</strong> Standard individual users engaging in basic services with low transaction volumes.</p>
              <ul className="list-disc list-inside text-[11px] text-slate-400 pl-4">
                <li>Due Diligence: Standard KYC as outlined in Section 4.</li>
              </ul>
              <p><strong className="text-slate-200">5.2 Medium-Risk Users:</strong> Vendors, businesses, and users with higher transaction volumes or cross-border activities.</p>
              <ul className="list-disc list-inside text-[11px] text-slate-400 pl-4">
                <li>Due Diligence: Enhanced KYC including source of funds declaration and periodic re-verification.</li>
              </ul>
              <p><strong className="text-slate-200">5.3 High-Risk Users:</strong> PEPs, users from high-risk jurisdictions, or users with unusual transaction patterns.</p>
              <ul className="list-disc list-inside text-[11px] text-slate-400 pl-4">
                <li>Due Diligence: Enhanced due diligence including senior management approval for onboarding, ongoing transaction monitoring, and quarterly reviews.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">6. TRANSACTION MONITORING</h3>
            <p className="text-[11px] text-slate-400">We maintain systems and procedures to monitor transactions across our platform:</p>
            <div className="space-y-3 pl-3">
              <p className="font-bold text-slate-200 text-[11px]">6.1 Monitoring Mechanisms:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>Automated transaction monitoring systems flagging transactions above established thresholds</li>
                <li>Pattern analysis to detect structuring (multiple small transactions designed to avoid detection)</li>
                <li>Cross-referencing of user activity across multiple service verticals</li>
                <li>Review of rapid movement of funds between accounts</li>
              </ul>

              <p className="font-bold text-slate-200 text-[11px] mt-4">6.2 Red Flags:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>Transactions inconsistent with a user&apos;s known profile or activity history</li>
                <li>Reluctance to provide required identification documents</li>
                <li>Unusual transaction patterns (frequency, volume, or value)</li>
                <li>Transactions involving high-risk jurisdictions</li>
                <li>Use of multiple accounts by a single user without legitimate explanation</li>
                <li>Attempts to circumvent transaction limits or monitoring systems</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">7. RECORD-KEEPING POLICY</h3>
            <p className="text-[11px] text-slate-400">We maintain comprehensive records as required by law:</p>
            <div className="space-y-3 pl-3">
              <p className="font-bold text-slate-200 text-[11px]">7.1 Retention Period:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>All transaction records are retained for a minimum of 5 years after the transaction date</li>
                <li>All KYC documentation is retained for 5 years after the closure of the user&apos;s account</li>
                <li>Suspicious Activity Reports are retained for 5 years from the date of filing</li>
              </ul>
              <p className="font-bold text-slate-200 text-[11px] mt-4">7.2 Record Types:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>User identification and verification documents</li>
                <li>Transaction records including amount, date, parties involved, and nature of transaction</li>
                <li>Correspondence with users regarding transactions and account activity</li>
                <li>Internal investigation reports and SAR documentation</li>
                <li>AML training records for staff</li>
              </ul>
              <p className="font-bold text-slate-200 text-[11px] mt-4">7.3 Record Storage:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>All records are stored securely in encrypted digital storage systems</li>
                <li>Access to records is restricted on a need-to-know basis</li>
                <li>Physical documents, where applicable, are stored in locked, access-controlled facilities</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">8. REPORTING SUSPICIOUS ACTIVITIES</h3>
            <p className="text-[11px] text-slate-400">We maintain a clear process for identifying and reporting suspicious activities:</p>
            <div className="space-y-3 pl-3">
              <p className="font-bold text-slate-200 text-[11px]">8.1 Internal Reporting:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>All employees and agents are required to report any suspicious activity or transaction to the Compliance Officer immediately</li>
                <li>Reports are documented in writing and maintained confidentially</li>
                <li>No tipping-off policy: Under no circumstances shall a user be informed that they are the subject of a suspicious activity report</li>
              </ul>
              <p className="font-bold text-slate-200 text-[11px] mt-4">8.2 External Reporting:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>The Compliance Officer reviews all internal reports and determines whether a SAR should be filed with the Nigerian Financial Intelligence Unit (NFIU)</li>
                <li>SARs are filed within the timeframe required by Nigerian law</li>
                <li>Cooperation with law enforcement agencies during investigations is mandatory</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">9. COMPLIANCE OFFICER</h3>
            <p className="text-[11px] text-slate-400">The Company has appointed a dedicated Compliance Officer responsible for:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
              <li>Implementing and maintaining this AML policy</li>
              <li>Reviewing and updating the policy as regulations evolve</li>
              <li>Receiving and investigating internal suspicious activity reports</li>
              <li>Filing SARs with the NFIU when required</li>
              <li>Conducting AML training for all staff and relevant stakeholders</li>
              <li>Serving as the primary point of contact for regulatory authorities</li>
            </ul>
            <p className="text-[11px] font-bold text-slate-200 mt-2">Contact:</p>
            <p className="text-[11px] text-slate-400 pl-2">Compliance Officer<br />EFADO Technology Computer Engineering and Training Services</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">10. TRAINING AND AWARENESS</h3>
            <p className="text-[11px] text-slate-400">We ensure that all relevant personnel receive adequate AML training:</p>
            <div className="space-y-3 pl-3">
              <p className="font-bold text-slate-200 text-[11px]">10.1 Training Frequency:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>Initial AML training upon employment or engagement</li>
                <li>Refresher training annually</li>
                <li>Additional training when regulations are updated or when new risks are identified</li>
              </ul>
              <p className="font-bold text-slate-200 text-[11px] mt-4">10.2 Training Content:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
                <li>Understanding money laundering and terrorist financing</li>
                <li>Recognizing red flags and suspicious activities</li>
                <li>KYC procedures and documentation requirements</li>
                <li>Reporting procedures and obligations</li>
                <li>Record-keeping requirements</li>
                <li>Consequences of non-compliance</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">11. INDEPENDENT AUDIT AND REVIEW</h3>
            <p className="text-[11px] text-slate-400">This AML policy and the Company&apos;s AML/CFT controls are subject to:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
              <li>Annual internal audit review</li>
              <li>External audit every two years or as required by regulatory changes</li>
              <li>Periodic assessment by the Compliance Officer to ensure effectiveness</li>
              <li>Updates and amendments as necessary based on audit findings and regulatory developments</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">12. SANCTIONS AND NON-COMPLIANCE</h3>
            <p className="text-[11px] text-slate-400">The Company maintains a zero-tolerance approach to money laundering:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
              <li>Any employee found to have knowingly facilitated money laundering activities will face disciplinary action up to and including dismissal and legal prosecution</li>
              <li>Users found to be engaged in suspicious activities will have their accounts suspended or terminated immediately</li>
              <li>The Company fully cooperates with regulatory authorities in any investigation</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-indigo-500 pl-3">13. POLICY REVIEW AND UPDATES</h3>
            <p className="text-[11px] text-slate-400">This policy is reviewed annually by the Compliance Officer and senior management. Updates are made to reflect:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-2">
              <li>Changes in Nigerian AML/CFT legislation</li>
              <li>Changes in international AML standards</li>
              <li>Operational changes to the Efado Hubs Connect platform</li>
              <li>Findings from internal or external audits</li>
              <li>Emerging risks and typologies in money laundering</li>
            </ul>
          </div>

          <div className="space-y-6 pt-6 border-t border-white/10">
            <h3 className="text-xs font-black text-white tracking-wider uppercase border-l-4 border-emerald-500 pl-3">14. ACKNOWLEDGMENT AND SIGNATURE</h3>
            <p className="text-[11px] text-slate-400">This AML policy has been reviewed and approved by the Chief Executive Officer.</p>
            <div className="bg-white/5 p-6 rounded-2xl space-y-2 text-[11px] max-w-md">
              <p className="font-black text-white uppercase tracking-wider">Okhawere Festus</p>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Chief Executive Officer</p>
              <p className="text-indigo-400 font-black">EFADO Technology Computer Engineering and Training Services</p>
              <p className="text-slate-500 font-bold text-[9px]">DATE APPROVED: JULY 2026</p>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-white/5 px-8 py-5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
          >
            I Acknowledge Policy
          </button>
        </div>
      </motion.div>
    </div>
  );
};
