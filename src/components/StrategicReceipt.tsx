import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  Printer,
  CheckCircle2,
  FileText,
  CloudUpload,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { Transaction } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { getWalletCurrencyMeta } from '../constants/walletCurrencies';

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
      pdf.save(`EFADO-Receipt-${transaction.reference || transaction.id || 'TX'}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleUploadToVault = async () => {
    setIsUploading(true);
    try {
      await addDoc(collection(db, 'receipts'), {
        transactionId: transaction.id || transaction.reference,
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

  const currCode = (transaction.currency || 'NGN').toUpperCase().trim();
  const currSymbol = getWalletCurrencyMeta(currCode).symbol;
  const txDate = transaction.timestamp instanceof Date
    ? transaction.timestamp.toLocaleString()
    : transaction.timestamp?.toDate
      ? transaction.timestamp.toDate().toLocaleString()
      : (transaction as any)?.createdAtIso
        ? new Date((transaction as any).createdAtIso).toLocaleString()
        : new Date().toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1100] bg-purple-50/95 backdrop-blur-sm overflow-y-auto flex flex-col font-sans"
    >
      <nav className="sticky top-0 z-20 bg-white border-b border-purple-100 shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <div className="text-center hidden sm:block">
            <span className="text-xs font-bold text-[#7C3AED]">EFADO Payment Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold"
            >
              <Printer className="w-4 h-4 text-[#7C3AED]" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#7C3AED] hover:bg-purple-700 rounded-xl text-white text-xs font-bold disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Saving...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleUploadToVault}
              disabled={isUploading || uploadSuccess}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${
                uploadSuccess
                  ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {uploadSuccess ? <CheckCircle2 className="w-4 h-4" /> : <CloudUpload className="w-4 h-4 text-[#16A34A]" />}
              <span>{isUploading ? 'Saving...' : uploadSuccess ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6">
        <div
          ref={receiptRef}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100"
        >
          <div className="h-2 bg-[#7C3AED] w-full" />

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#7C3AED] rounded-2xl flex items-center justify-center shadow-sm">
                    <span className="text-xl font-black text-white">E</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 m-0">EFADO Wallet</h2>
                    <p className="text-xs font-medium text-slate-500 m-0 max-w-none">Official Transaction Receipt</p>
                  </div>
                </div>
                <div className="flex flex-col text-xs font-medium text-slate-500 gap-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" /> EFADO Digital Settlement
                  </span>
                  <span className="flex items-center gap-1.5 text-[#7C3AED]">
                    <ExternalLink className="w-3.5 h-3.5" /> e-fado.com
                  </span>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-xs font-semibold text-slate-400 block">Reference ID</span>
                <p className="text-sm font-bold text-slate-900 font-mono m-0 max-w-none">
                  {transaction.reference || transaction.id || 'TXN'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[#16A34A] bg-emerald-50 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Secure Payment - Verified</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-slate-100 py-5">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Account Holder</span>
                <p className="text-sm font-bold text-slate-900 m-0 max-w-none">{userEmail || 'EFADO Member'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Date & Time</span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-[#7C3AED]" />
                  <span>{txDate}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Transaction Type</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <FileText className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-sm font-bold text-slate-900 capitalize">
                    {String(transaction.type || 'payment').replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Payment Method</span>
                <span className="text-sm font-bold text-slate-900">{transaction.method || 'EFADO Wallet'}</span>
              </div>
            </div>

            <div className="bg-purple-50/60 rounded-2xl p-5 space-y-3 border border-purple-100">
              <div className="flex items-center justify-between text-slate-600 font-semibold text-sm">
                <span>Amount</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {currSymbol}
                  {Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-semibold text-sm">
                <span>Fee</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {currSymbol}
                  {Number(transaction.fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-px bg-purple-200" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-900 m-0 max-w-none">Total</p>
                  <p className="text-xs text-slate-500 m-0 max-w-none">
                    {transaction.purpose || transaction.description || 'Verified transaction'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {currSymbol}
                    {(Number(transaction.amount || 0) + Number(transaction.fee || 0)).toLocaleString(undefined, {
                      minimumFractionDigits: 2
                    })}
                  </div>
                  <span className="text-xs font-bold text-[#16A34A] uppercase">
                    {transaction.status === 'completed' ? 'Success' : transaction.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 font-medium pt-2">
              Protected by 256-bit encryption • EFADO Wallet Official Receipt
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
