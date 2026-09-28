import { useState, useCallback, useEffect } from 'react';
import { 
  generateImage as apiGenerateImage, 
  editImage as apiEditImage, 
  searchWithGrounding as apiSearchWithGrounding, 
  startVoiceChat as apiStartVoiceChat, 
  animateImageToVideo as apiAnimateImageToVideo,
  getDailyUsage,
  DailyUsage,
  ImageResult,
  SearchGroundingResult,
  VoiceChatSession,
  VIDEO_CONFIG,
  VideoGenerationConfig
} from '../services/aiCoreService';

export function useAI() {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(() => getDailyUsage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUsage = useCallback(() => {
    setDailyUsage(getDailyUsage());
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const generateImage = useCallback(async (
    prompt: string,
    options?: { aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' }
  ): Promise<ImageResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGenerateImage(prompt, options);
      if (!res.success && res.error) {
        setError(res.error);
      }
      refreshUsage();
      return res;
    } catch (err: any) {
      const msg = err.message || 'Image generation failed';
      setError(msg);
      return { success: false, error: msg, usage: getDailyUsage() };
    } finally {
      setLoading(false);
    }
  }, [refreshUsage]);

  const editImage = useCallback(async (
    prompt: string,
    base64Image: string,
    mimeType?: string
  ): Promise<ImageResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiEditImage(prompt, base64Image, mimeType);
      if (!res.success && res.error) {
        setError(res.error);
      }
      refreshUsage();
      return res;
    } catch (err: any) {
      const msg = err.message || 'Image editing failed';
      setError(msg);
      return { success: false, error: msg, usage: getDailyUsage() };
    } finally {
      setLoading(false);
    }
  }, [refreshUsage]);

  const searchWithGrounding = useCallback(async (
    query: string
  ): Promise<SearchGroundingResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiSearchWithGrounding(query);
      if (!res.success && res.error) {
        setError(res.error);
      }
      refreshUsage();
      return res;
    } catch (err: any) {
      const msg = err.message || 'Grounding search failed';
      setError(msg);
      return { success: false, error: msg, usage: getDailyUsage() };
    } finally {
      setLoading(false);
    }
  }, [refreshUsage]);

  const startVoiceChat = useCallback((options?: {
    systemInstruction?: string;
    onListeningChange?: (listening: boolean) => void;
    onSpeakingChange?: (speaking: boolean) => void;
  }): VoiceChatSession => {
    return apiStartVoiceChat(options);
  }, []);

  const animateImageToVideo = useCallback(async (
    prompt: string,
    image: string,
    options?: { aspectRatio?: '16:9' | '9:16'; duration?: number }
  ) => {
    return apiAnimateImageToVideo(prompt, image, options);
  }, []);

  return {
    generateImage,
    editImage,
    searchWithGrounding,
    startVoiceChat,
    animateImageToVideo,
    dailyUsage,
    refreshUsage,
    loading,
    error,
    clearError: () => setError(null),
    videoConfig: VIDEO_CONFIG as VideoGenerationConfig
  };
}
