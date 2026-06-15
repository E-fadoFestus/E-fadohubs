import React from 'react';
import { motion, Variants } from 'motion/react';
import efadoLogo from '../assets/images/efado_logo_1781368963212.jpg';

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
        <div className="absolute inset-0 rounded-full overflow-hidden shadow-xl border border-white/30 bg-indigo-950 flex items-center justify-center">
          <img 
            src={efadoLogo} 
            alt="EFADO HUBS Logo" 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
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
