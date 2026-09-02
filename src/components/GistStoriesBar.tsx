import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Heart, Send, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { UserProfile, GistStory } from '../types';

interface GistStoriesBarProps {
  user: UserProfile;
  onOpenLive?: () => void;
  onSelectStory?: (story: any) => void;
}

const DEFAULT_STORIES: GistStory[] = [
  {
    id: 'story-1',
    authorId: 'dr_sarah',
    authorName: 'Dr. Sarah',
    authorPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    caption: 'Leading the fintech engineering sprint today! 💻✨',
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 82800000,
    views: ['user-1', 'user-2']
  },
  {
    id: 'story-2',
    authorId: 'emeka_biz',
    authorName: 'Chief Emeka',
    authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    caption: 'Closing new investment round for African logistics 🚀💼',
    createdAt: Date.now() - 7200000,
    expiresAt: Date.now() + 79200000,
    views: ['user-3']
  },
  {
    id: 'story-3',
    authorId: 'kemi_gist',
    authorName: 'Kemi Gist',
    authorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    caption: 'Lagos concert night vibes! Who else is outside? 🎶🔥',
    createdAt: Date.now() - 10800000,
    expiresAt: Date.now() + 75600000,
    views: ['user-4', 'user-5', 'user-6']
  },
  {
    id: 'story-4',
    authorId: 'bishop_t',
    authorName: 'Bishop T.',
    authorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    caption: 'Daily Devotion: The hand of the diligent shall bear rule. 🙏📖',
    createdAt: Date.now() - 14400000,
    expiresAt: Date.now() + 72000000,
    views: ['user-7']
  }
];

export const GistStoriesBar: React.FC<GistStoriesBarProps> = ({ user }) => {
  const [stories, setStories] = useState<GistStory[]>(() => {
    try {
      const saved = localStorage.getItem('efado_stories');
      return saved ? JSON.parse(saved) : DEFAULT_STORIES;
    } catch {
      return DEFAULT_STORIES;
    }
  });

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState('');
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [seenStories, setSeenStories] = useState<string[]>([]);

  // Story progress timer
  useEffect(() => {
    if (activeStoryIndex === null) {
      setStoryProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + 2; // ~5 seconds per story
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, stories.length]);

  const handleOpenStory = (index: number) => {
    setActiveStoryIndex(index);
    setStoryProgress(0);
    const storyId = stories[index].id;
    if (!seenStories.includes(storyId)) {
      setSeenStories(prev => [...prev, storyId]);
    }
  };

  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryMedia.trim()) {
      alert("Please enter an image or video URL for your story.");
      return;
    }

    const newStory: GistStory = {
      id: `story-my-${Date.now()}`,
      authorId: user.uid,
      authorName: user.displayName || 'You',
      authorPhoto: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      mediaUrl: newStoryMedia.trim(),
      mediaType: newStoryMedia.match(/\.(mp4|webm)/i) ? 'video' : 'image',
      caption: newStoryCaption.trim() || undefined,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      views: []
    };

    const updated = [newStory, ...stories];
    setStories(updated);
    localStorage.setItem('efado_stories', JSON.stringify(updated));
    setShowAddStoryModal(false);
    setNewStoryMedia('');
    setNewStoryCaption('');
    alert("Story published to your status!");
  };

  return (
    <div className="w-full">
      {/* Stories Horizontal Tray */}
      <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar py-2 px-1">
        {/* Card 1: Add to Story Button */}
        <div 
          onClick={() => setShowAddStoryModal(true)}
          className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
        >
          <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-cyan-400 group-hover:scale-105 transition-transform shadow-md">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-slate-950">
              <img 
                src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} 
                alt="My Story" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-purple-600 rounded-full border-2 border-slate-950 flex items-center justify-center text-white">
              <Plus className="w-3 h-3" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-300 truncate max-w-[68px]">Your Story</span>
        </div>

        {/* Friend Stories Cards */}
        {stories.map((story, idx) => {
          const isSeen = seenStories.includes(story.id);
          return (
            <div 
              key={story.id}
              onClick={() => handleOpenStory(idx)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className={`w-16 h-16 rounded-full p-0.5 transition-transform group-hover:scale-105 shadow-md ${
                isSeen 
                  ? 'bg-slate-700' 
                  : 'bg-gradient-to-tr from-purple-500 via-rose-500 to-cyan-400 animate-pulse'
              }`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-slate-950">
                  <img 
                    src={story.authorPhoto || `https://picsum.photos/seed/${story.authorId}/100/100`} 
                    alt={story.authorName} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-300 truncate max-w-[68px]">
                {story.authorName.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Story Viewer */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
            {/* Story Card Frame */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md h-full sm:h-[85vh] sm:rounded-3xl overflow-hidden bg-slate-900 border border-white/10 flex flex-col justify-between"
            >
              {/* Media Background */}
              <div className="absolute inset-0 z-0">
                {stories[activeStoryIndex].mediaType === 'video' ? (
                  <video 
                    src={stories[activeStoryIndex].mediaUrl} 
                    autoPlay 
                    playsInline 
                    loop 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <img 
                    src={stories[activeStoryIndex].mediaUrl} 
                    alt="Story" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
              </div>

              {/* Progress Bars & Header */}
              <div className="relative z-20 p-4 space-y-3">
                {/* Progress Indicators */}
                <div className="flex items-center gap-1.5 w-full">
                  {stories.map((s, idx) => (
                    <div key={s.id} className="flex-grow h-1 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all"
                        style={{
                          width: idx < activeStoryIndex 
                            ? '100%' 
                            : idx === activeStoryIndex 
                              ? `${storyProgress}%` 
                              : '0%'
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full border border-purple-500 overflow-hidden">
                      <img 
                        src={stories[activeStoryIndex].authorPhoto || `https://picsum.photos/seed/${stories[activeStoryIndex].authorId}/100/100`} 
                        alt="Author" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {stories[activeStoryIndex].authorName}
                      </h4>
                      <p className="text-[10px] text-slate-300 font-medium">Active 24hr Status</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveStoryIndex(null)}
                    className="p-2 bg-black/40 hover:bg-black/70 rounded-full text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Left/Right Tap Zones for Previous/Next */}
              <div className="absolute inset-0 z-10 flex">
                <div 
                  className="w-1/2 h-full cursor-pointer"
                  onClick={() => {
                    if (activeStoryIndex > 0) {
                      setActiveStoryIndex(activeStoryIndex - 1);
                      setStoryProgress(0);
                    }
                  }}
                />
                <div 
                  className="w-1/2 h-full cursor-pointer"
                  onClick={() => {
                    if (activeStoryIndex < stories.length - 1) {
                      setActiveStoryIndex(activeStoryIndex + 1);
                      setStoryProgress(0);
                    } else {
                      setActiveStoryIndex(null);
                    }
                  }}
                />
              </div>

              {/* Story Footer & Reply */}
              <div className="relative z-20 p-4 space-y-3">
                {stories[activeStoryIndex].caption && (
                  <p className="text-xs text-white font-medium bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 leading-relaxed">
                    {stories[activeStoryIndex].caption}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Reply to status..."
                    className="flex-grow bg-black/50 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-full text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        alert("Reply sent to author's direct message!");
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      alert("Sent love reaction! ❤️");
                    }}
                    className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-all active:scale-90"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Story Modal */}
      <AnimatePresence>
        {showAddStoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#121A2F] border border-white/15 rounded-3xl p-6 shadow-2xl text-white relative"
            >
              <button 
                onClick={() => setShowAddStoryModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">Add 24-Hour Story</h3>
                <p className="text-xs text-slate-400 mt-1">Share photos, quick videos, or status thoughts with your connections!</p>
              </div>

              <form onSubmit={handleAddStory} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Photo or Video URL</label>
                  <input 
                    type="text"
                    placeholder="Paste image or mp4 URL..."
                    value={newStoryMedia}
                    onChange={(e) => setNewStoryMedia(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                  />
                  <div className="flex gap-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setNewStoryMedia('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80')} 
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-purple-300 border border-white/5 font-bold"
                    >
                      Sample 1
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNewStoryMedia('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80')} 
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-cyan-300 border border-white/5 font-bold"
                    >
                      Sample 2
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Caption (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Having a productive week at EFADO! 🚀"
                    value={newStoryCaption}
                    onChange={(e) => setNewStoryCaption(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button"
                    onClick={() => setShowAddStoryModal(false)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
                  >
                    Publish Status 🌟
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
