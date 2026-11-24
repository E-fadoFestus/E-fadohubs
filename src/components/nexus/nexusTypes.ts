export type NexusSubPageId =
  | 'gist-world'
  | 'connect'
  | 'vibes'
  | 'moments'
  | 'assembly'
  | 'mind-pro';

export interface NexusIntegrationConfig {
  id: NexusSubPageId;
  slug: string;
  name: string;
  tagline: string;
  shortDesc: string;
  cardBg: string;
  cardBorder: string;
  iconBg: string;
  accentText: string;
  buttonBg: string;
}

export const NEXUS_INTEGRATIONS: NexusIntegrationConfig[] = [
  {
    id: 'gist-world',
    slug: 'gist-world',
    name: 'EFADO Gist World',
    tagline: 'Community Feed, Groups, Events & Stories',
    shortDesc: 'Posts, reactions, comments, shares, groups, pages, live feed, and saved gist.',
    cardBg: 'bg-sky-50',
    cardBorder: 'border-sky-200',
    iconBg: 'bg-sky-100 text-sky-700',
    accentText: 'text-sky-700',
    buttonBg: 'bg-sky-600 hover:bg-sky-700 text-white'
  },
  {
    id: 'connect',
    slug: 'connect',
    name: 'EFADO Connect',
    tagline: 'Private Chats, Voice Notes & Calls',
    shortDesc: 'Direct chat, group chat, voice notes, voice & video calls, status, and file sharing.',
    cardBg: 'bg-emerald-50',
    cardBorder: 'border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700',
    accentText: 'text-emerald-700',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  },
  {
    id: 'vibes',
    slug: 'vibes',
    name: 'EFADO Vibes',
    tagline: 'Short Videos, Music & Creator Fund',
    shortDesc: 'Watch & post short videos, add music, try duets, live vibes, and track earnings.',
    cardBg: 'bg-rose-50',
    cardBorder: 'border-rose-200',
    iconBg: 'bg-rose-100 text-rose-700',
    accentText: 'text-rose-700',
    buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white'
  },
  {
    id: 'moments',
    slug: 'moments',
    name: 'EFADO Moments',
    tagline: 'Stories, Photo Gallery & Close Friends',
    shortDesc: 'Share clear photos, highlights, explore moments, close friends, and saved albums.',
    cardBg: 'bg-purple-50',
    cardBorder: 'border-purple-200',
    iconBg: 'bg-purple-100 text-purple-700',
    accentText: 'text-purple-700',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white'
  },
  {
    id: 'assembly',
    slug: 'assembly',
    name: 'EFADO Assembly',
    tagline: 'Big Channels, Polls & Broadcasts',
    shortDesc: 'Large communities, announcements, live polls, pinned updates, and channel tools.',
    cardBg: 'bg-amber-50',
    cardBorder: 'border-amber-200',
    iconBg: 'bg-amber-100 text-amber-700',
    accentText: 'text-amber-800',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  {
    id: 'mind-pro',
    slug: 'mind-pro',
    name: 'EFADO Mind Pro',
    tagline: 'Home of Reason, Voice Mark & EFADO AI',
    shortDesc: 'Voice Mark tools, EFADO AI assistant, Human support chat, and Mind Pro faculties.',
    cardBg: 'bg-indigo-50',
    cardBorder: 'border-indigo-200',
    iconBg: 'bg-indigo-100 text-indigo-700',
    accentText: 'text-indigo-700',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  }
];

export type ReactionKey = 'Like' | 'Love' | 'Care' | 'Laugh' | 'Wow' | 'Sad';

export const REACTION_LIST: Array<{ key: ReactionKey; emoji: string; color: string }> = [
  { key: 'Like', emoji: '👍', color: 'text-blue-600' },
  { key: 'Love', emoji: '❤️', color: 'text-rose-600' },
  { key: 'Care', emoji: '🤗', color: 'text-amber-600' },
  { key: 'Laugh', emoji: '😂', color: 'text-orange-600' },
  { key: 'Wow', emoji: '😮', color: 'text-purple-600' },
  { key: 'Sad', emoji: '😢', color: 'text-slate-600' }
];

export async function compressNexusImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected photo.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxSide = 1080;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          const ratio = Math.min(maxSide / width, maxSide / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function fileToSafeDataUrl(file: File, maxBytes = 650 * 1024): Promise<string> {
  if (file.size > maxBytes && !file.type.startsWith('image/')) {
    throw new Error('File is larger than 650 KB. Please choose a smaller file.');
  }
  if (file.type.startsWith('image/')) {
    return compressNexusImage(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

export function formatRelativeTime(ts: any): string {
  if (!ts) return 'Just now';
  let ms = 0;
  if (typeof ts?.toMillis === 'function') ms = ts.toMillis();
  else if (typeof ts?.seconds === 'number') ms = ts.seconds * 1000;
  else if (ts instanceof Date) ms = ts.getTime();
  else if (typeof ts === 'string' || typeof ts === 'number') ms = new Date(ts).getTime();
  if (!ms || Number.isNaN(ms)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return new Date(ms).toLocaleDateString();
}
