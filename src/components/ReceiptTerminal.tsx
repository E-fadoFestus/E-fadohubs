import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Printer, 
  Share2, 
  FileText, 
  CheckCircle2, 
  X,
  CreditCard,
  Building2,
  Calendar,
  ShieldCheck,
  Globe,
  QrCode,
  Smartphone,
  Bitcoin,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ReceiptData {
  transactionId: string;
  amount: number | string;
  currency: string;
  date: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'purchase';
  method: string;
  status: 'completed' | 'pending' | 'failed';
  sender?: string;
  recipient?: string;
  description?: string;
  reference?: string;
}

interface ReceiptTerminalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ReceiptTerminal: React.FC<ReceiptTerminalProps> = ({ receipt, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!receipt) return null;

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EFADO_Receipt_${receipt.transactionId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header Controls */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Transaction Receipt</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Automatic Command Generated</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Receipt Content Scroll Area */}
          <div className="flex-grow overflow-y-auto p-8 bg-gray-50/30 custom-scrollbar">
            {/* Actual Receipt Visual - This is what gets captured/printed */}
            <div 
              ref={receiptRef}
              className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden print:p-8 print:shadow-none print:border-none"
              style={{ minHeight: '600px' }}
            >
              {/* Trademark Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-[-30deg]">
                <div className="text-center font-display">
                  <h1 className="text-8xl font-black text-indigo-900 leading-none">EFADO</h1>
                  <h2 className="text-3xl font-black text-indigo-900 tracking-[0.5em] uppercase">Hubs Connect</h2>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Logo & Info Header */}
                <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-8">
                  <div>
                    <h1 className="text-2xl font-black text-indigo-900 tracking-tighter italic mb-1">EFADO Hubs Connect</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Digital Ecosystem Command</p>
                    <p className="text-[9px] text-gray-400 font-medium mt-2">www.efado.connect</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {receipt.status}
                    </div>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="text-center mb-12">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-2">Total Transaction Amount</p>
                  <h2 className="text-5xl font-black text-gray-900 tracking-tighter">
                    {typeof receipt.amount === 'number' ? `${receipt.currency} ${receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : receipt.amount}
                  </h2>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-2 gap-y-8 gap-x-12 mb-12">
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Transaction ID</p>
                    <p className="text-xs font-mono font-bold text-gray-700 break-all">#{receipt.transactionId.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Date & Time</p>
                    <p className="text-xs font-bold text-gray-700">{receipt.date}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center">
                        {receipt.method.toLowerCase().includes('card') ? <CreditCard className="w-3 h-3 text-indigo-600" /> :
                         receipt.method.toLowerCase().includes('bank') ? <Building2 className="w-3 h-3 text-emerald-600" /> :
                         receipt.method.toLowerCase().includes('crypto') ? <Bitcoin className="w-3 h-3 text-orange-600" /> :
                         <Smartphone className="w-3 h-3 text-rose-600" />}
                      </div>
                      <span className="text-xs font-bold text-gray-700">{receipt.method}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Command Type</p>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-tight">{receipt.type}</p>
                  </div>
                  
                  {receipt.sender && (
                    <div className="col-span-2">
                       <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Origin / Sender</p>
                       <p className="text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{receipt.sender}</p>
                    </div>
                  )}

                  {receipt.recipient && (
                    <div className="col-span-2">
                       <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Destination / Recipient</p>
                       <p className="text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{receipt.recipient}</p>
                    </div>
                  )}

                  {receipt.description && (
                    <div className="col-span-2">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Strategic Description</p>
                      <p className="text-xs font-medium text-gray-600 leading-relaxed italic">"{receipt.description}"</p>
                    </div>
                  )}
                </div>

                {/* Footer Assurance */}
                <div className="mt-auto border-t border-dashed border-gray-200 pt-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 brightness-110" />
                    <div>
                      <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Authenticated by EFADO Secure</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">End-to-End Financial Integrity</p>
                    </div>
                  </div>
                  <div className="w-16 h-16 opacity-20 hover:opacity-100 transition-opacity">
                    <QrCode className="w-full h-full text-indigo-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 border-t border-gray-100 bg-gray-50/80 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Processing...' : <><Download className="w-4 h-4" /> Download PDF</>}
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
            
            <p className="text-[8px] text-center text-gray-400 font-bold uppercase tracking-widest">
              This receipt is electronically generated and holds holistic legal validity within the EFADO Ecosystem.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
