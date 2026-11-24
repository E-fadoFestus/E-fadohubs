import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { AdListing } from '../types';
import { efadoAdvertApi } from '../services/efadoAdvertApi';

interface AdvertShareBarProps {
  ad: Pick<AdListing, 'id' | 'slug' | 'title' | 'price' | 'location'>;
  compact?: boolean;
  onShared?: (channel: string, feedback?: string) => void;
}

export const AdvertShareBar: React.FC<AdvertShareBarProps> = ({
  ad,
  compact = false,
  onShared,
}) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const { url, text } = efadoAdvertApi.buildShareMessage(ad);

  const notifyCopied = (platform: string, feedback: string) => {
    setCopiedPlatform(platform);
    onShared?.(platform, feedback);
    setTimeout(() => setCopiedPlatform(null), 3000);
  };

  const handleCopy = async (platform: string, customFeedback?: string) => {
    const payload = platform === 'link' ? url : text;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Clipboard fallback omitted intentionally to avoid blocking prompt popups
    }
    void efadoAdvertApi.trackShare(ad.id, platform);
    notifyCopied(
      platform,
      customFeedback || 'Link copied! Paste and share anywhere.'
    );
  };

  const openSocial = (platform: string, targetUrl: string) => {
    void efadoAdvertApi.trackShare(ad.id, platform);
    onShared?.(platform);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInstagramShare = async () => {
    await handleCopy(
      'instagram',
      'Caption and advert link copied! Opening Instagram so you can paste it in your post or story.'
    );
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  const handleTikTokShare = async () => {
    await handleCopy(
      'tiktok',
      'Caption and advert link copied! Opening TikTok so you can paste it in your video or bio.'
    );
    window.open('https://www.tiktok.com/upload', '_blank', 'noopener,noreferrer');
  };

  const buttons = [
    {
      id: 'whatsapp',
      label: 'Share to WhatsApp',
      shortLabel: 'WhatsApp',
      bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200',
      onClick: () =>
        openSocial(
          'whatsapp',
          `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
        ),
    },
    {
      id: 'facebook',
      label: 'Share to Facebook',
      shortLabel: 'Facebook',
      bg: 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200',
      onClick: () =>
        openSocial(
          'facebook',
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
        ),
    },
    {
      id: 'instagram',
      label: 'Share to Instagram',
      shortLabel: 'Instagram',
      bg: 'bg-pink-50 hover:bg-pink-100 text-pink-900 border-pink-200',
      onClick: handleInstagramShare,
    },
    {
      id: 'threads',
      label: 'Share to Threads',
      shortLabel: 'Threads',
      bg: 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200',
      onClick: () =>
        openSocial(
          'threads',
          `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`
        ),
    },
    {
      id: 'x',
      label: 'Share to X',
      shortLabel: 'X',
      bg: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200',
      onClick: () =>
        openSocial(
          'x',
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
        ),
    },
    {
      id: 'tiktok',
      label: 'Share to TikTok',
      shortLabel: 'TikTok',
      bg: 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200',
      onClick: handleTikTokShare,
    },
  ];

  return (
    <div className="space-y-3">
      <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-2.5`}>
        {buttons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={btn.onClick}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${btn.bg}`}
          >
            {btn.id === 'whatsapp' ? (
              <MessageCircle className="w-4 h-4 shrink-0" />
            ) : btn.id === 'facebook' || btn.id === 'threads' ? (
              <Globe className="w-4 h-4 shrink-0" />
            ) : (
              <ExternalLink className="w-4 h-4 shrink-0" />
            )}
            <span>{compact ? btn.shortLabel : btn.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => handleCopy('link', 'Advert link copied! Share it anywhere.')}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            copiedPlatform === 'link'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
          } ${compact ? 'col-span-2 sm:col-span-3' : 'sm:col-span-2 lg:col-span-3'}`}
        >
          {copiedPlatform === 'link' ? (
            <>
              <Check className="w-4 h-4 shrink-0" />
              <span>Link Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 shrink-0" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      {copiedPlatform && copiedPlatform !== 'link' && (
        <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Share2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>Link and advert details copied — paste into {copiedPlatform} to post!</span>
        </p>
      )}
    </div>
  );
};
