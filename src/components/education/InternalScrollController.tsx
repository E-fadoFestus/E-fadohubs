import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface InternalScrollControllerProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  label?: string;
}

export const InternalScrollController: React.FC<InternalScrollControllerProps> = ({ containerRef, className = '', label = 'Page Navigation' }) => {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);

  const checkScroll = () => {
    const el = containerRef?.current;
    if (el) {
      setCanScrollUp(el.scrollTop > 20);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 20);
    } else {
      setCanScrollUp(window.scrollY > 20);
      setCanScrollDown(window.scrollY + window.innerHeight < document.body.scrollHeight - 20);
    }
  };

  useEffect(() => {
    const el = containerRef?.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => el.removeEventListener('scroll', checkScroll);
    } else {
      window.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => window.removeEventListener('scroll', checkScroll);
    }
  }, [containerRef]);

  const scrollByAmount = (amount: number) => {
    const el = containerRef?.current;
    if (el) {
      el.scrollBy({ top: amount, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`fixed bottom-5 right-5 z-[130] flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-xl border border-indigo-500/40 p-2 rounded-2xl shadow-2xl shadow-indigo-950/50 ${className}`}>
      {label && <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider px-2 hidden sm:inline">{label}</span>}
      <button
        type="button"
        onClick={() => scrollByAmount(-350)}
        title="Scroll Up"
        className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl transition-all active:scale-95 border border-white/10 flex items-center gap-1 cursor-pointer"
      >
        <ArrowUp className="w-4 h-4" />
        <span className="text-[9px] font-bold uppercase tracking-wider hidden md:inline">Up</span>
      </button>
      <button
        type="button"
        onClick={() => scrollByAmount(350)}
        title="Scroll Down"
        className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-600/30 flex items-center gap-1 cursor-pointer"
      >
        <ArrowDown className="w-4 h-4" />
        <span className="text-[9px] font-bold uppercase tracking-wider hidden md:inline">Down</span>
      </button>
    </div>
  );
};
