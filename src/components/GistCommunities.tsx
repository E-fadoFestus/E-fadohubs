import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Hash, 
  Search, 
  Check, 
  ChevronRight, 
  Shield, 
  Sparkles, 
  MessageSquare, 
  Flame, 
  Globe, 
  Lock,
  X,
  Share2
} from 'lucide-react';
import { UserProfile, CommunityGroup } from '../types';

interface GistCommunitiesProps {
  user: UserProfile;
  onSelectCommunity?: (tag: string) => void;
  onOpenCommunityChat?: (group: any) => void;
}

const DEFAULT_COMMUNITIES: CommunityGroup[] = [
  {
    id: 'comm-tech',
    name: 'Tech Innovators Nigeria & Africa',
    tag: '#Tech',
    category: 'Technology',
    description: 'Code, AI tools, African startups, VC investments, and building high-growth digital businesses.',
    avatarUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    membersCount: 42800,
    members: [],
    moderators: ['Tunde Tech', 'Chioma AI'],
    rules: ['No spam', 'Respect intellectual property', 'Constructive feedback only']
  },
  {
    id: 'comm-business',
    name: 'Young African Entrepreneurs Hub',
    tag: '#Business',
    category: 'Business & Finance',
    description: 'Scaling MSMEs, business strategies, supplier connections, import/export, and financial intelligence.',
    avatarUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    membersCount: 36500,
    members: [],
    moderators: ['Chief Emeka', 'Kemi B.'],
    rules: ['Verified listings only', 'No deceptive schemes', 'Support fellow builders']
  },
  {
    id: 'comm-comedy',
    name: 'Naija Comedy & Relatable Gist',
    tag: '#Comedy',
    category: 'Entertainment',
    description: 'Daily street humor, viral skits, hilarious hot-takes, and positive community energy.',
    avatarUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=800&q=80',
    membersCount: 58900,
    members: [],
    moderators: ['Brother Paul', 'Skit Master'],
    rules: ['Keep it friendly', 'No hate speech', 'Laugh freely']
  },
  {
    id: 'comm-crypto',
    name: 'Web3, Crypto & FX Traders',
    tag: '#Crypto',
    category: 'Finance',
    description: 'Market analysis, sovereign digital tokens, P2P safety, and decentralized finance education.',
    avatarUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    membersCount: 29400,
    members: [],
    moderators: ['Crypto Victor', 'Sovereign Desk'],
    rules: ['DYOR - Do Your Own Research', 'No unsolicited DMs', 'Share verified charts']
  },
  {
    id: 'comm-marketplace',
    name: 'Verified Deals & Marketplace',
    tag: '#Marketplace',
    category: 'E-Commerce',
    description: 'Direct buyer-to-seller marketplace deals across gadgets, vehicles, fashion, and real estate.',
    avatarUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=800&q=80',
    membersCount: 47100,
    members: [],
    moderators: ['EFADO Verified Desk'],
    rules: ['Escrow or in-person checks recommended', 'Transparent pricing', 'Accurate photos']
  },
  {
    id: 'comm-faith',
    name: 'Faith, Prayer & Wisdom Walk',
    tag: '#Faith',
    category: 'Spiritual & Inspiration',
    description: 'Daily spiritual uplifting, faith declarations, scriptural study, and community prayers.',
    avatarUrl: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80',
    membersCount: 31200,
    members: [],
    moderators: ['Bishop T.', 'Pastor Grace'],
    rules: ['Honor one another', 'Encourage fellow believers', 'No blasphemy']
  }
];

export const GistCommunities: React.FC<GistCommunitiesProps> = ({ user, onSelectCommunity }) => {
  const [communities, setCommunities] = useState<CommunityGroup[]>(DEFAULT_COMMUNITIES);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`efado_joined_comm_${user.uid}`);
      return saved ? JSON.parse(saved) : ['comm-tech', 'comm-business'];
    } catch {
      return ['comm-tech', 'comm-business'];
    }
  });
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'JOINED'>('EXPLORE');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Community form state
  const [newCommName, setNewCommName] = useState('');
  const [newCommTag, setNewCommTag] = useState('#');
  const [newCommCategory, setNewCommCategory] = useState('Technology');
  const [newCommDesc, setNewCommDesc] = useState('');

  const toggleJoinCommunity = (id: string) => {
    setJoinedCommunities(prev => {
      const isJoined = prev.includes(id);
      const updated = isJoined ? prev.filter(c => c !== id) : [...prev, id];
      localStorage.setItem(`efado_joined_comm_${user.uid}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim() || !newCommTag.trim() || !newCommDesc.trim()) {
      alert("Please fill in all community fields!");
      return;
    }

    const formattedTag = newCommTag.startsWith('#') ? newCommTag : `#${newCommTag}`;
    const newGroup: CommunityGroup = {
      id: `comm-custom-${Date.now()}`,
      name: newCommName.trim(),
      tag: formattedTag,
      category: newCommCategory,
      description: newCommDesc.trim(),
      avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
      bannerUrl: `https://picsum.photos/seed/${Date.now() + 1}/800/400`,
      membersCount: 1,
      members: [user.uid],
      moderators: [user.displayName || 'Creator'],
      rules: ['Respect members', 'Follow EFADO community guidelines']
    };

    setCommunities(prev => [newGroup, ...prev]);
    setJoinedCommunities(prev => [...prev, newGroup.id]);
    setShowCreateModal(false);
    setNewCommName('');
    setNewCommTag('#');
    setNewCommDesc('');
    alert(`Community "${newGroup.name}" created successfully!`);
  };

  const filteredCommunities = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'JOINED') {
      return matchesSearch && joinedCommunities.includes(c.id);
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-cyan-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> EFADO Communities
              </span>
              <span className="text-xs text-slate-400">• Facebook Groups Experience</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Connect, Trade & Gist in Specialized Circles
            </h2>
            <p className="text-sm text-slate-300 font-normal mt-2 max-w-2xl leading-relaxed">
              Join active interest groups or create your own sovereign hub to build an audience, host discussions, and monetize your influence.
            </p>
          </div>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Create Community
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('EXPLORE')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'EXPLORE' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Explore ({communities.length})
          </button>
          <button 
            onClick={() => setActiveTab('JOINED')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'JOINED' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Joined ({joinedCommunities.length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search groups, topics, hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-2.5 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-medium"
          />
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map(community => {
          const isJoined = joinedCommunities.includes(community.id);
          return (
            <div 
              key={community.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:border-purple-500/50 transition-all flex flex-col overflow-hidden group"
            >
              {/* Banner */}
              <div className="h-28 w-full relative overflow-hidden bg-slate-800">
                <img 
                  src={community.bannerUrl} 
                  alt={community.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-black/40" />
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-cyan-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/10">
                  {community.tag}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 -mt-10 mb-3 relative z-10">
                    <div className="w-14 h-14 rounded-2xl border-2 border-purple-500 overflow-hidden bg-slate-900 shadow-xl flex-shrink-0">
                      <img 
                        src={community.avatarUrl} 
                        alt={community.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="pt-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{community.category}</p>
                      <p className="text-xs text-cyan-300 font-bold">{community.membersCount.toLocaleString()} Members</p>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-tight mb-2">
                    {community.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed line-clamp-2 mb-4">
                    {community.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <button 
                      onClick={() => toggleJoinCommunity(community.id)}
                      className={`flex-grow py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        isJoined 
                          ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30' 
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Joined
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Join Community
                        </>
                      )}
                    </button>

                    {onSelectCommunity && (
                      <button 
                        onClick={() => onSelectCommunity(community.tag)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold"
                        title="View Community Feed Posts"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg bg-[#121A2F] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">Create EFADO Community</h3>
                <p className="text-xs text-slate-400 mt-1">Lead a sovereign tribe and grow recurring traffic for your topics!</p>
              </div>

              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Community Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Lagos Real Estate Investors Hub"
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Hashtag Tag</label>
                    <input 
                      type="text"
                      placeholder="#RealEstate"
                      value={newCommTag}
                      onChange={(e) => setNewCommTag(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Category</label>
                    <select 
                      value={newCommCategory}
                      onChange={(e) => setNewCommCategory(e.target.value)}
                      className="w-full bg-[#0A0F1E] border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Business & Finance">Business & Finance</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Finance">Crypto & FX</option>
                      <option value="E-Commerce">Marketplace & Deals</option>
                      <option value="Spiritual & Inspiration">Faith & Inspiration</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="What is this community about? What value will members get?"
                    value={newCommDesc}
                    onChange={(e) => setNewCommDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-medium resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
                  >
                    Launch Community 🚀
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
