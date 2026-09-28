/**
 * EFADO HUBS CONNECT - CENTRALIZED AI CORE SERVICE
 * Anti-Scatter Rule: ALL AI functions live exclusively in this service.
 * All other hubs and components MUST import from this file or useAI hook.
 * 
 * Billing Protection:
 * - Rate limiting: max 3 AI calls per user per day for free.
 * - Error handling: graceful fallbacks, hubs never break.
 * - Video generation (Veo 3): strictly locked with inactive monetization logic.
 */

export interface DailyUsage {
  used: number;
  max: number;
  remaining: number;
  date: string;
  usageText: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchGroundingResult {
  success: boolean;
  text?: string;
  sources?: GroundingSource[];
  searchQueries?: string[];
  error?: string;
  usage?: DailyUsage;
}

export interface ImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  usage?: DailyUsage;
}

export interface VideoGenerationConfig {
  isLocked: boolean;
  lockScreenText: string;
  unlockFee: number;
  currency: string;
  unlockFeeFormatted: string;
  watermark: string;
  currentFreeDailyLimit: number;
  futureFreeDailyLimit: number;
  isUnlockedForUser: boolean;
}

// Monetization & Video Protection State
export const VIDEO_CONFIG: VideoGenerationConfig = {
  isLocked: true,
  lockScreenText: "🎬 Video Ad Generation Coming Soon - Unlock Soon",
  unlockFee: 5000,
  currency: "NGN",
  unlockFeeFormatted: "NGN 5,000.00",
  watermark: "Made with EFADO AI",
  currentFreeDailyLimit: 0, // Disabled now to protect from billing
  futureFreeDailyLimit: 2,  // 2 free daily when user commands "Enable Video"
  isUnlockedForUser: false
};

const DAILY_LIMIT = 3;

/**
 * Get the current daily usage counter for billing protection.
 */
export function getDailyUsage(): DailyUsage {
  if (typeof window === 'undefined') {
    return {
      used: 0,
      max: DAILY_LIMIT,
      remaining: DAILY_LIMIT,
      date: new Date().toISOString().split('T')[0],
      usageText: `You have used 0/${DAILY_LIMIT} free AI generations today`
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `efado_ai_usage_${today}`;
  const raw = localStorage.getItem(storageKey);
  const used = raw ? parseInt(raw, 10) : 0;
  const safeUsed = isNaN(used) ? 0 : used;
  const remaining = Math.max(0, DAILY_LIMIT - safeUsed);

  return {
    used: safeUsed,
    max: DAILY_LIMIT,
    remaining,
    date: today,
    usageText: `You have used ${safeUsed}/${DAILY_LIMIT} free AI generations today`
  };
}

/**
 * Records an AI generation call in local storage.
 */
export function recordUsage(): DailyUsage {
  if (typeof window === 'undefined') return getDailyUsage();

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `efado_ai_usage_${today}`;
  const current = getDailyUsage();
  const nextUsed = current.used + 1;
  localStorage.setItem(storageKey, String(nextUsed));

  return getDailyUsage();
}

/**
 * Validates if the user has remaining free generations today.
 */
export function checkRateLimit(): { allowed: boolean; usage: DailyUsage; message?: string } {
  const usage = getDailyUsage();
  if (usage.remaining <= 0) {
    return {
      allowed: false,
      usage,
      message: `Daily limit reached. ${usage.usageText}. Please come back tomorrow or upgrade.`
    };
  }
  return { allowed: true, usage };
}

/**
 * Generate an image using Gemini server-side models.
 */
export async function generateImage(
  prompt: string,
  options?: { aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' }
): Promise<ImageResult> {
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: rateCheck.message,
      usage: rateCheck.usage
    };
  }

  try {
    const res = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aspectRatio: options?.aspectRatio || '1:1'
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || 'Image generation failed. Please try a different prompt.',
        usage: getDailyUsage()
      };
    }

    const updatedUsage = recordUsage();
    return {
      success: true,
      imageUrl: data.imageUrl,
      usage: updatedUsage
    };
  } catch (err: any) {
    console.error('[AI Core Service] generateImage error:', err);
    return {
      success: false,
      error: 'Network connection to AI engine temporarily unavailable. Other hub features remain active.',
      usage: getDailyUsage()
    };
  }
}

/**
 * Edit an existing image with a text prompt.
 */
export async function editImage(
  prompt: string,
  base64Image: string,
  mimeType: string = 'image/png'
): Promise<ImageResult> {
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: rateCheck.message,
      usage: rateCheck.usage
    };
  }

  try {
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const res = await fetch('/api/ai/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image: cleanBase64,
        mimeType
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || 'Image editing could not be completed with this instruction.',
        usage: getDailyUsage()
      };
    }

    const updatedUsage = recordUsage();
    return {
      success: true,
      imageUrl: data.imageUrl,
      usage: updatedUsage
    };
  } catch (err: any) {
    console.error('[AI Core Service] editImage error:', err);
    return {
      success: false,
      error: 'Image editing engine temporarily unavailable.',
      usage: getDailyUsage()
    };
  }
}

/**
 * Perform a real-time Google Search Grounded query.
 */
export async function searchWithGrounding(query: string): Promise<SearchGroundingResult> {
  if (!query || !query.trim()) {
    return { success: false, error: 'Search query cannot be empty.' };
  }

  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: rateCheck.message,
      usage: rateCheck.usage
    };
  }

  try {
    const res = await fetch('/api/ai/search-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || 'Unable to retrieve grounded web data at this time.',
        usage: getDailyUsage()
      };
    }

    const updatedUsage = recordUsage();
    return {
      success: true,
      text: data.text,
      sources: data.sources || [],
      searchQueries: data.searchQueries || [],
      usage: updatedUsage
    };
  } catch (err: any) {
    console.error('[AI Core Service] searchWithGrounding error:', err);
    return {
      success: false,
      error: 'Google Grounding service temporarily unavailable. Standard search remains active.',
      usage: getDailyUsage()
    };
  }
}

export interface VoiceChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: number;
}

export interface VoiceChatSession {
  sendMessage: (text: string) => Promise<{ reply: string; audioBase64?: string }>;
  speak: (text: string) => void;
  stopAudio: () => void;
}

/**
 * Start or initialize an interactive Voice Chat session (Gemini Live API & Audio).
 */
export function startVoiceChat(options?: {
  systemInstruction?: string;
  onListeningChange?: (listening: boolean) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}): VoiceChatSession {
  const systemInstruction = options?.systemInstruction || 
    'You are EFADO AI Tutor, an articulate, encouraging academic and strategic mentor for EFADO HUBS CONNECT. Keep answers concise, inspiring, and clear.';

  let currentUtterance: SpeechSynthesisUtterance | null = null;

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => options?.onSpeakingChange?.(true);
      utterance.onend = () => options?.onSpeakingChange?.(false);
      utterance.onerror = () => options?.onSpeakingChange?.(false);
      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[AI Core Service] Speech synthesis warning:', e);
      options?.onSpeakingChange?.(false);
    }
  };

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      options?.onSpeakingChange?.(false);
    }
  };

  const sendMessage = async (text: string): Promise<{ reply: string; audioBase64?: string }> => {
    try {
      const res = await fetch('/api/ai/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          systemInstruction
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Voice tutor response unavailable');
      }

      const reply = data.text || 'I understood your query. How can I assist you further?';
      speak(reply);
      return { reply, audioBase64: data.audioBase64 };
    } catch (err: any) {
      const fallback = 'I heard you, but my network bridge is currently reconnecting. Please ask again in a moment.';
      speak(fallback);
      return { reply: fallback };
    }
  };

  return {
    sendMessage,
    speak,
    stopAudio
  };
}

/**
 * Animate an image into video (Veo 3).
 * 
 * STRICT BILLING PROTECTION:
 * This function is fully structured with monetization parameters, but is intentionally
 * DISABLED and NEVER invokes the Google Veo API.
 */
export async function animateImageToVideo(
  prompt: string,
  image: string,
  options?: { aspectRatio?: '16:9' | '9:16'; duration?: number }
): Promise<{ success: boolean; locked: boolean; message: string; config: VideoGenerationConfig }> {
  // TODO: Connect to payment gateway - Billing Account: [USER TO INSERT BILLING ACCOUNT DETAILS HERE] - All N5000 payments should go to this account to cover Google Veo billing
  
  // Daily free limit logic = 0 for now (since disabled), but code it as 2 free later
  const dailyFreeLimit = 0;
  
  // Watermark logic: 'Made with EFADO AI' for free tier
  const watermarkText = VIDEO_CONFIG.watermark;

  console.info(`[AI Core Service] Veo 3 video requested with watermark "${watermarkText}" and free limit ${dailyFreeLimit}. Feature locked to protect billing.`);

  // DO NOT call Veo API at all for now. So Google will NOT bill the user.
  return {
    success: false,
    locked: true,
    message: VIDEO_CONFIG.lockScreenText,
    config: {
      ...VIDEO_CONFIG,
      currentFreeDailyLimit: dailyFreeLimit
    }
  };
}

/**
 * Generate high-engagement viral caption for Gist Hub Reels using server-side AI.
 */
export async function generateReelCaption(concept: string, userName: string = 'Creator'): Promise<string> {
  const cleanConcept = concept.trim() || 'Manifesting greatness';
  try {
    const res = await fetch('/api/ai/voice-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Create a catchy, high-engagement viral caption with trending hashtags and emojis for an EFADO video reel by ${userName}. Concept: "${cleanConcept}". Keep it under 140 characters.`,
        systemInstruction: 'You are EFADO AI Social Copywriter. Create catchy, authentic, viral social captions with 2-3 hashtags and emojis. Return only the caption text.'
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text.trim();
    }
  } catch (err) {
    console.warn('[AI Core Service] generateReelCaption fallback engaged:', err);
  }
  return `🚀 ${cleanConcept} | Next-level vibes on EFADO Gist! ✨ #ViralReels #EFADO #Trending`;
}

