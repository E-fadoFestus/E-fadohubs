import React from 'react';
import { motion, Variants } from 'motion/react';

interface Efado3DLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Efado3DLogo: React.FC<Efado3DLogoProps> = ({ 
  className = "", 
  size = 'md' 
}) => {
  const sizes = {
    sm: { container: 'w-16 h-16' },
    md: { container: 'w-24 h-24' },
    lg: { container: 'w-40 h-40' },
    xl: { container: 'w-64 h-64' }
  };

  const currentSize = sizes[size];

  // Professional floating and breathing animation for the wordmark only
  const wordmarkVariants: Variants = {
    animate: {
      y: [0, -10, 0],
      scale: [1, 1.05, 1],
      filter: [
        'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))',
        'drop-shadow(0 0 30px rgba(251, 191, 36, 0.8))',
        'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))'
      ],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div 
        className="relative flex items-center justify-center p-4 cursor-pointer group"
        variants={wordmarkVariants}
        animate="animate"
      >
        {/* Advanced Shimmer Effect */}
        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          <motion.div 
            className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-20"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1
            }}
          />
        </div>

        <svg 
          viewBox="0 0 400 120" 
          className="w-full h-auto transition-all duration-500"
          style={{ width: size === 'xl' ? '400px' : size === 'lg' ? '280px' : size === 'md' ? '180px' : '100px' }}
        >
          <defs>
            <linearGradient id="efadoGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="eliteGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <text 
            x="50%" 
            y="85%" 
            textAnchor="middle" 
            className="font-black italic uppercase select-none"
            fill="url(#efadoGold)"
            filter="url(#eliteGlow)"
            style={{ 
              fontSize: '120px', 
              letterSpacing: '-0.03em',
              fontWeight: 900,
            }}
          >
            EFADO
          </text>
        </svg>
      </motion.div>
    </div>
  );
};
