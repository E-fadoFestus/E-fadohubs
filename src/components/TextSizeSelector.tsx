import React, { useState, useEffect } from 'react';
import { Type } from 'lucide-react';

export type TextSizeOption = 'normal' | 'large' | 'xlarge';

export const TextSizeSelector: React.FC = () => {
  const [textSize, setTextSize] = useState<TextSizeOption>(() => {
    return (localStorage.getItem('efado_text_size') as TextSizeOption) || 'normal';
  });
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize);
    localStorage.setItem('efado_text_size', textSize);
  }, [textSize]);

  const cycleTextSize = () => {
    if (textSize === 'normal') setTextSize('large');
    else if (textSize === 'large') setTextSize('xlarge');
    else setTextSize('normal');
  };

  const labels = {
    normal: { tag: 'A', label: 'Standard' },
    large: { tag: 'A+', label: 'Large' },
    xlarge: { tag: 'A++', label: 'X-Large' }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={cycleTextSize}
        title={`Text Size: ${labels[textSize].label} (Click to resize)`}
        aria-label="Toggle Text Size"
        className="flex items-center gap-1 px-2 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 group"
      >
        <Type className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
        <span className="font-mono font-black text-amber-300 px-1 py-0.2 bg-amber-500/10 rounded border border-amber-500/20 text-[10px]">
          {labels[textSize].tag}
        </span>
      </button>
    </div>
  );
};
