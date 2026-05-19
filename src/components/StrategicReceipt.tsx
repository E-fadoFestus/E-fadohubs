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
  DollarSign
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto no-scrollbar"
    >
      <div className="relative w-full max-w-2xl my-8">
        {/* Controls Overlay */}
        <div className="absolute -top-16 left-0 right-0 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-md border border-white/10"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating...' : 'Download PDF'}
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-md border border-white/10"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={handleUploadToVault}
              disabled={isUploading || uploadSuccess}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-md border ${
                uploadSuccess ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              {uploadSuccess ? <CheckCircle2 className="w-4 h-4" /> : <CloudUpload className="w-4 h-4" />}
              {isUploading ? 'Vaulting...' : uploadSuccess ? 'Vaulted' : 'Upload to Vault'}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tactical Receipt Sheet */}
        <div 
          ref={receiptRef}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden relative print:shadow-none"
        >
          {/* Golden Strategic Watermark - EFADO */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] select-none overflow-hidden">
            <div className="w-full h-full bg-amber-400/5 absolute inset-0" />
            <h1 className="text-[15rem] md:text-[20rem] font-black italic tracking-tighter rotate-[-35deg] text-amber-500 whitespace-nowrap">
              E-FADO
            </h1>
          </div>

          {/* Header Strip */}
          <div className="h-2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 w-full" />

          <div className="p-8 md:p-12 space-y-12">
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
                <p className="text-lg font-black text-slate-900 font-mono">#{transaction.reference || transaction.id?.slice(-8).toUpperCase() || 'INTERNAL'}</p>
                <div className="mt-4 flex items-center md:justify-end gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit md:ml-auto">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified Transaction</span>
                </div>
              </div>
            </div>

            {/* Main Payload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-y border-slate-100 py-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recipient Entity</h4>
                  <p className="text-sm font-bold text-slate-900">{userEmail || 'Individual User'}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">UID: {transaction.userId}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Temporal Execution</h4>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    {transaction.timestamp instanceof Date ? transaction.timestamp.toLocaleString() : 
                     transaction.timestamp?.toDate ? transaction.timestamp.toDate().toLocaleString() : 
                     new Date().toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transaction Sector</h4>
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
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Integrity</h4>
                  <p className="text-sm font-bold text-slate-900 font-mono">{transaction.reference || 'SYSTEM_INTERNAL_OVD'}</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-3xl p-6 md:p-10 space-y-6">
              <div className="flex items-center justify-between text-slate-500 font-bold text-sm">
                <span>Sub-Total Allocation</span>
                <span className="font-mono">${transaction.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-bold text-sm">
                <span>Tactical Service Charge</span>
                <span className="font-mono">${(transaction.fee || 0).toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Sovereign Valuation</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Transaction Ref: {transaction.reference}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-3xl md:text-4xl font-black text-slate-900 font-display">
                    <DollarSign className="w-8 h-8 text-amber-500" />
                    {(transaction.amount + (transaction.fee || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-2 bg-emerald-50 px-2 py-0.5 rounded">Completed Success</span>
                </div>
              </div>
            </div>

            {/* Compliance Footer */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
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
          <div className="h-4 bg-slate-950 flex items-center justify-center gap-8 px-12 overflow-hidden">
            {[1,2,3,4,5].map(i => (
              <span key={i} className="text-[6px] font-black text-slate-700 uppercase tracking-[1em] whitespace-nowrap">
                EFADO SECURE TRANSACTION PROTOCOL 2026 // IDENTITY VERIFIED // NO REVERSALS
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
