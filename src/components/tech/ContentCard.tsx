import React from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Users, 
  Clock, 
  CheckCircle2, 
  ShoppingCart,
  Calendar,
  ExternalLink,
  Eye
} from 'lucide-react';
import { TechContent } from '../../types';
import { useCurrency } from '../../lib/CurrencyContext';

interface ContentCardProps {
  content: TechContent;
  onAction?: (id: string) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ content, onAction }) => {
  const { formatPrice } = useCurrency();

  const getActionLabel = () => {
    switch (content.contentType) {
      case 'live': return 'Join Live';
      case 'learning': return 'Enroll Now';
      case 'product': return 'Purchase';
      case 'showcase': return 'Explore';
      default: return 'Watch Now';
    }
  };

  const getBadgeIcon = () => {
    if (content.isLive) return <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider animate-pulse">
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
      LIVE
    </div>;
    return null;
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl transition-all hover:border-indigo-500/30 shadow-xl"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={content.thumbnail} 
          alt={content.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          {getBadgeIcon()}
          <span className="bg-slate-900/80 backdrop-blur-md text-white/90 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border border-white/10">
            {content.format}
          </span>
        </div>

        {content.duration && (
          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-mono">
            {content.duration}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-current" />
          </div>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{content.topic}</span>
           <span className="w-1 h-1 bg-slate-700 rounded-full" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{content.region}</span>
        </div>

        <h3 className="text-sm font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors">
          {content.title}
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-bold text-indigo-400">
              {content.creatorName.charAt(0)}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-400">{content.creatorName}</span>
              {content.isVerified && <CheckCircle2 className="w-3 h-3 text-indigo-500" />}
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-slate-500">
            <Eye className="w-3 h-3" />
            <span className="text-[10px] font-mono">{(content.views / 1000).toFixed(1)}k</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="text-lg font-black text-white">
            {content.price ? formatPrice(content.price) : 'FREE'}
          </div>
          <button 
            onClick={() => onAction?.(content.id)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-indigo-600 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white"
          >
            {getActionLabel()}
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
