import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import confetti from 'canvas-confetti';
import { GAME_OUTCOMES, getSpinOutcome } from '../lib/gameLogic';
import { Coins, Play } from 'lucide-react';

interface LuckySpinProps {
  onSpin: (bet: number) => Promise<void>;
  onResult: (multiplier: number) => Promise<void>;
  balance: number;
  isSpinning: boolean;
}

export function LuckySpin({ onSpin, onResult, balance, isSpinning }: LuckySpinProps) {
  const [bet, setBet] = useState(10);
  const controls = useAnimation();
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (balance < bet || isSpinning) return;

    // Start the process
    await onSpin(bet);

    // Determine outcome
    const outcome = getSpinOutcome();
    const outcomeIndex = GAME_OUTCOMES.indexOf(outcome);
    const sliceAngle = 360 / GAME_OUTCOMES.length;
    
    // Calculate rotation to land on the outcome
    // We want the outcome to be at the top (0 degrees)
    // Each slice is sliceAngle wide. 
    // The first outcome (0x) is at 0 to sliceAngle.
    // To land on outcomeIndex, we need to rotate so that the slice is at the top.
    const targetRotation = 360 * 5 + (360 - (outcomeIndex * sliceAngle + sliceAngle / 2));

    await controls.start({
      rotate: targetRotation,
      transition: { duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }
    });

    // Handle result
    if (outcome.multiplier > 1) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    await onResult(outcome.multiplier);
    
    // Reset rotation for next spin (keeping it seamless)
    controls.set({ rotate: targetRotation % 360 });
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
      <div className="relative mb-12">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-red-600 clip-path-triangle rotate-180 shadow-lg" />
        
        {/* Wheel */}
        <motion.div 
          ref={wheelRef}
          animate={controls}
          className="w-80 h-80 rounded-full border-8 border-gray-800 relative overflow-hidden shadow-2xl"
          style={{ transformOrigin: 'center' }}
        >
          {GAME_OUTCOMES.map((outcome, i) => {
            const angle = 360 / GAME_OUTCOMES.length;
            const rotation = i * angle;
            return (
              <div 
                key={i}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 origin-bottom flex items-start justify-center pt-4"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  backgroundColor: outcome.color,
                  clipPath: `polygon(50% 100%, 0 0, 100% 0)`
                }}
              >
                <span className="text-white font-bold text-lg -rotate-0 mt-2">{outcome.label}</span>
              </div>
            );
          })}
        </motion.div>
        
        {/* Center Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gray-900 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-20">
          <Coins className="text-yellow-400 w-8 h-8" />
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
          <span className="text-sm font-medium text-gray-500">Bet Amount</span>
          <div className="flex items-center gap-3">
            {[5, 10, 25, 50].map((val) => (
              <button 
                key={val}
                onClick={() => setBet(val)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${bet === val ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-200'}`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSpin}
          disabled={isSpinning || balance < bet}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isSpinning || balance < bet ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-200'}`}
        >
          {isSpinning ? 'SPINNING...' : (
            <>
              <Play className="w-5 h-5 fill-current" />
              SPIN FOR ${bet}
            </>
          )}
        </button>
        
        {balance < bet && !isSpinning && (
          <p className="text-center text-red-500 text-xs font-medium">Insufficient balance in Player Wallet</p>
        )}
      </div>
    </div>
  );
}
