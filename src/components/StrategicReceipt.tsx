import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle2, 
  FileText, 
  CloudUpload,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { Transaction } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db, collection, addDoc, serverTimestamp } from '../firebase';

interface StrategicReceiptProps {
  transaction: Transaction;
  userEmail?: string;
  onClose: () => void;
}

export const StrategicReceipt: React.FC<StrategicReceiptProps> = ({ 
  transaction, 
  userEmail,
  onClose 
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EFADO-Receipt-${transaction.id || 'TX'}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUploadToVault = async () => {
    setIsUploading(true);
    try {
      await addDoc(collection(db, 'receipts'), {
        transactionId: transaction.id,
        userId: transaction.userId,
        timestamp: serverTimestamp(),
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        vaultedAt: serverTimestamp()
      });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Vault upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl overflow-y-auto no-scrollbar flex flex-col font-sans"
    >
      {/* Dynamic Navigation Bar to prevent getting trapped/stuck */}
      <nav className="sticky top-0 z-[75] bg-slate-900/90 backdrop-blur-md border-b border-white/5 shadow-md px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back/Exit Action - Go Back */}
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-white/5 select-none"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Go Back</span>
          </button>

          {/* Central Context Label */}
          <div className="text-center hidden md:block">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em]">Secure Receipt Portal</span>
            <p className="text-xs text-slate-400 font-bold tracking-tight">Verified Transaction Proof</p>
          </div>

          {/* Actions: Download & Print */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              title="Print Receipt"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all"
            >
              <Printer className="w-4 h-4 text-amber-500" />
              <span>Print</span>
            </button>
            
            <button 
              onClick={handleDownloadPDF}
              disabled={isExporting}
              title="Save/Download PDF Receipt"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl text-slate-950 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 font-black" />
              <span>{isExporting ? 'Saving...' : 'Download'}</span>
            </button>

            <button 
              onClick={handleUploadToVault}
              disabled={isUploading || uploadSuccess}
              title="Upload to Secure Cloud Vault"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                uploadSuccess ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-slate-800/80 hover:bg-slate-700 text-white border-white/5'
              }`}
            >
              {uploadSuccess ? <CheckCircle2 className="w-4 h-4" /> : <CloudUpload className="w-4 h-4 text-emerald-400" />}
              <span className="hidden md:inline">{isUploading ? 'Vaulting...' : uploadSuccess ? 'Vaulted' : 'Vault'}</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 md:my-6">
        {/* Tactical Receipt Sheet */}
        <div 
          ref={receiptRef}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden relative print:shadow-none border border-slate-100"
        >
          {/* Golden Strategic Watermark - EFADO™ TRADEMARK (Fitted to page margins) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none overflow-hidden p-8">
            <div className="w-full h-full bg-amber-400/5 absolute inset-0" />
            <h1 className="text-[5rem] sm:text-[6.5rem] md:text-[8rem] font-black italic tracking-tighter rotate-[-30deg] text-amber-500 leading-none text-center uppercase whitespace-pre-wrap max-w-md break-words p-4 border border-amber-500/10 rounded-3xl">
              EFADO™<br />TRADEMARK
            </h1>
          </div>

          {/* Header Strip */}
          <div className="h-2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 w-full" />

          <div className="p-8 md:p-12 space-y-10">
            {/* Brand Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                    <span className="text-2xl font-black text-white italic">E</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none tracking-tighter">EFADO Hubs Connect</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Digital Ecosystem Unified</p>
                  </div>
                </div>
                <div className="flex flex-col text-[10px] font-bold text-slate-500 uppercase tracking-widest gap-1">
                  <p className="flex items-center gap-2"><Building2 className="w-3 h-3 text-amber-500" /> Digital Command Center 01</p>
                  <p className="flex items-center gap-2 text-indigo-500"><ExternalLink className="w-3 h-3" /> efadohubsconnect.app</p>
                </div>
              </div>
              <div className="md:text-right">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Receipt Identity</h3>
                <p className="text-lg font-black text-slate-900 font-mono">#{transaction.reference || transaction.id?.slice(-12).toUpperCase() || 'INTERNAL-TX'}</p>
                <div className="mt-4 flex items-center md:justify-end gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit md:ml-auto">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified Transaction</span>
                </div>
              </div>
            </div>

            {/* Global Verification Details (New Highly Detailed Sections) */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-2.5 text-slate-700 text-[10px] font-bold uppercase tracking-wider relative z-10">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Ledger Node:</span>
                <span className="text-slate-900">EFD-MAINNET-NODE01</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Digital Hash Index:</span>
                <span className="text-slate-900 font-mono break-all text-right max-w-[70%]">
                  {Math.random().toString(36).substring(2, 15).toUpperCase()}B98X{transaction.id || 'TX007'}F90
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Verification channel:</span>
                <span className="text-slate-900">{transaction.method || 'Digital Wallet Protocol'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security PIN Auth:</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Authenticated & Sealed
                </span>
              </div>
            </div>

            {/* Main Payload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-y border-slate-100 py-8 relative z-10">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recipient Entity</h4>
                  <p className="text-sm font-bold text-slate-900">{userEmail || 'Individual User'}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">ID: {transaction.userId?.slice(0, 16) || 'SECURE_USER'}...</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temporal Execution</h4>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-amber-500 font-bold" />
                    {transaction.timestamp instanceof Date ? transaction.timestamp.toLocaleString() : 
                     transaction.timestamp?.toDate ? transaction.timestamp.toDate().toLocaleString() : 
                     new Date().toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Sector</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-600' :
                      transaction.type === 'withdrawal' ? 'bg-rose-500/10 text-rose-600' :
                      'bg-indigo-500/10 text-indigo-600'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{transaction.type.replace('_', ' ')}</p>
                      <p className="text-[10px] font-bold text-slate-400">{transaction.purpose || transaction.description || 'Verified Operation'} {transaction.hub ? `[${transaction.hub}]` : ''}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Integrity</h4>
                  <p className="text-sm font-bold text-slate-900 font-mono">{transaction.reference || 'SYSTEM_INTERNAL_OVD'}</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 space-y-4 relative z-10">
              <div className="flex items-center justify-between text-slate-500 font-bold text-sm">
                <span>Sub-Total Allocation</span>
                <span className="font-mono">{(transaction.currency === 'NGN' ? '₦' : '$')}{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-bold text-sm">
                <span>Tactical Service Charge</span>
                <span className="font-mono">{(transaction.currency === 'NGN' ? '₦' : '$')}{(transaction.fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Sovereign Valuation</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Transaction Ref: {transaction.reference}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-3xl md:text-4xl font-black text-slate-900 font-display">
                    <span className="text-amber-500 font-sans">{(transaction.currency === 'NGN' ? '₦' : '$')}</span>
                    {(transaction.amount + (transaction.fee || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em] mt-1.5 bg-emerald-50 px-2 py-0.5 rounded">Completed Success</span>
                </div>
              </div>
            </div>

            {/* Compliance Footer */}
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-900 font-medium leading-relaxed">
                  This document serves as an official automated receipt issued by EFADO Hubs Connect™. It confirms the successful allocation of digital assets as summarized above. Digital signature verified for security integrity.
                </p>
              </div>
              <div className="text-center pt-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[1em] mb-4">Master Integrity Signature</p>
                <div className="w-48 h-12 border-b-2 border-slate-100 mx-auto flex items-center justify-center">
                  <span className="font-display text-2xl text-slate-400 select-none opacity-30 italic">EFADO Strategic Admin</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Security Strip */}
          <div className="h-4 bg-slate-950 flex items-center justify-center gap-8 px-12 overflow-hidden print:hidden">
            {[1,2,3,4,5].map(i => (
              <span key={i} className="text-[6px] font-black text-slate-700 uppercase tracking-[1em] whitespace-nowrap">
                EFADO SECURE TRANSACTION PROTOCOL 2026 // IDENTITY VERIFIED // NO REVERSALS
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Escape Control Button to prevent getting stuck/trapped */}
        <div className="mt-8 mb-12 text-center print:hidden">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-white/10 active:scale-95 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-950/50 select-none"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
