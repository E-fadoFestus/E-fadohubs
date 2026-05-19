import React from 'react';
import { motion, Variants } from 'motion/react';

interface EfadoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
}

export const EfadoLogo: React.FC<EfadoLogoProps> = ({ 
  className = "", 
  size = 'md', 
  showText = true,
  animated = true 
}) => {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-base' },
    md: { icon: 'w-10 h-10', text: 'text-xl' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl' },
    xl: { icon: 'w-24 h-24', text: 'text-5xl' }
  };

  const currentSize = sizes[size];

  const logoVariants: Variants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    hover: {
      scale: 1.05,
      rotate: 5,
      transition: { duration: 0.4 }
    }
  };

  const ringVariants: Variants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const pulseVariants: Variants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className={`flex items-center gap-4 ${className}`}
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={logoVariants}
    >
      <div className={`relative ${currentSize.icon}`}>
        {/* Glow Layer */}
        {animated && (
          <motion.div 
            className="absolute inset-x-[-20%] inset-y-[-20%] bg-indigo-500/20 blur-xl rounded-full"
            variants={pulseVariants}
            animate="animate"
          />
        )}
        
        {/* Rotating Tactical Ring */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-indigo-500/30">
          <motion.circle 
            cx="50" cy="50" r="48" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeDasharray="4 8"
            variants={ringVariants}
            animate="animate"
          />
        </svg>

        {/* Main Logo Body */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500 rounded-2xl shadow-lg border border-white/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 text-white drop-shadow-lg">
            {/* Minimalist 'E' and 'F' conceptual node */}
            <path 
              d="M30 30h40M30 50h30M30 70h40M30 30v40" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="10" 
              strokeLinecap="round" 
              className="opacity-40"
            />
            {/* Core Neural Element */}
            <circle cx="50" cy="50" r="10" fill="white" />
            <path 
              d="M50 50 L80 20 M50 50 L80 80 M50 50 L20 50" 
              fill="none" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <h1 className={`${currentSize.text} font-black text-white tracking-tighter leading-none flex items-center gap-1 uppercase italic`}>
            EFADO
            <span className="text-amber-500">Hubs Connect</span>
            <span className="text-[10px] font-bold text-slate-500 self-start mt-0.5">™</span>
          </h1>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1 ml-0.5">
            All-In-One Digital Ecosystem
          </span>
        </div>
      )}
    </motion.div>
  );
};
