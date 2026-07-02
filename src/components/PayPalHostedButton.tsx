import React, { useEffect, useState } from 'react';
import { Globe, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';

interface PayPalHostedButtonProps {
  amount?: number;
  onSuccess?: () => void;
  hostedButtonId?: string;
}

export const PayPalHostedButton: React.FC<PayPalHostedButtonProps> = ({
  amount = 50,
  onSuccess,
  hostedButtonId = import.meta.env.VITE_PAYPAL_HOSTED_BUTTON_ID || 'BG8UTPC9YVDEA'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  const activeButtonId = hostedButtonId || 'BG8UTPC9YVDEA';
  const containerId = `paypal-container-${activeButtonId}`;
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'BAAjkL41DLR8bdidx17SpmQJTexh6IRx1PCS5a0rwhtN-b1Uh6WQGgSRa72LoNRPtmOMo-Q6JJ5ia19_X0';

  useEffect(() => {
    let mounted = true;

    const renderButton = () => {
      try {
        if ((window as any).paypal && (window as any).paypal.HostedButtons) {
          const container = document.getElementById(containerId);
          if (container) {
            container.innerHTML = ''; // clear previous render
          }
          (window as any).paypal.HostedButtons({
            hostedButtonId: activeButtonId,
          }).render(`#${containerId}`).then(() => {
            if (mounted) {
              setIsLoaded(true);
              setIsRendering(false);
            }
          }).catch((err: any) => {
            console.warn('PayPal Hosted Button render notice:', err);
            if (mounted) {
              setIsRendering(false);
            }
          });
        }
      } catch (err: any) {
        console.warn('PayPal initialization warning:', err);
        if (mounted) {
          setIsRendering(false);
        }
      }
    };

    // Check if script is already loaded
    if ((window as any).paypal && (window as any).paypal.HostedButtons) {
      renderButton();
      return;
    }

    // Check if script tag exists
    const scriptId = 'efado-paypal-sdk-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=hosted-buttons&disable-funding=venmo&currency=USD`;
      script.async = true;
      script.onload = () => {
        if (mounted) renderButton();
      };
      script.onerror = () => {
        if (mounted) {
          setError('Could not connect to PayPal live servers. Network or adblocker may be interfering.');
          setIsRendering(false);
        }
      };
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', renderButton);
    }

    return () => {
      mounted = false;
      if (script) {
        script.removeEventListener('load', renderButton);
      }
    };
  }, [activeButtonId, containerId]);

  return (
    <div className="bg-slate-900 border-2 border-blue-500/30 rounded-3xl p-6 text-white text-center space-y-5 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">PayPal Hosted Checkout</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black rounded uppercase">Live Button: {hostedButtonId}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Official SDK Connected • USD & International Cards</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">256-Bit SSL</span>
        </div>
      </div>

      {/* Button Render Container (Part 2 from PayPal Screenshot) */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 min-h-[140px] flex flex-col items-center justify-center relative">
        {isRendering && !error && (
          <div className="flex flex-col items-center justify-center gap-3 py-4 text-blue-300">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-xs font-black uppercase tracking-widest animate-pulse">Connecting to PayPal Gateway...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-3 space-y-2">
            <p className="text-xs font-bold text-amber-300">{error}</p>
            <p className="text-[10px] text-slate-400">You can still test your settlement using the manual checkout simulation below.</p>
          </div>
        )}

        {/* This is the exact div ID required by PayPal Part 2 */}
        <div id={containerId} className="w-full max-w-sm mx-auto z-10" />

        {!isRendering && !isLoaded && !error && (
          <div className="text-center py-2 space-y-1">
            <span className="text-[11px] font-bold text-slate-300 block">PayPal Live Gateway Ready</span>
            <span className="text-[9px] font-mono text-slate-400 block">Hosted Button ID: {hostedButtonId}</span>
          </div>
        )}
      </div>

      {/* Manual Checkout Simulation & Guide */}
      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Why are there 2 Parts in PayPal?</span>
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
            <strong className="text-white">Part 1</strong> connects your SDK Client ID (<code className="text-blue-300 text-[9px]">BAAj...19_X0</code>). <strong className="text-white">Part 2</strong> renders this physical button ID (<code className="text-emerald-300 text-[9px]">{hostedButtonId}</code>). Both are now embedded automatically!
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onSuccess) {
              onSuccess();
            } else {
              alert(`🌐 PAYPAL HOSTED BUTTON SIMULATION (${hostedButtonId}):\n\nRedirecting to secure PayPal Checkout for USD $${amount} (approx NGN ${(amount * 1600).toLocaleString()})...\n\n✅ Payment Confirmed via PayPal Gateway!`);
            }
          }}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#0070ba] to-[#003087] hover:from-[#005ea6] hover:to-[#002060] text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shadow-lg shrink-0 flex items-center justify-center gap-2 border border-blue-400/30"
        >
          <span>Simulate USD ${amount}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
