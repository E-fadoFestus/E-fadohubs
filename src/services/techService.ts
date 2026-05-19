import { TechContent } from '../types';

const MOCK_CONTENT: TechContent[] = [
  {
    id: '1',
    title: 'Quantum Computing Fundamentals: From Qubits to Algorithms',
    slug: 'quantum-fundamentals',
    creatorId: 'c1',
    creatorName: 'Dr. Sarah Chen',
    isVerified: true,
    topic: 'Emerging Tech',
    format: 'course',
    region: 'Global',
    language: 'English',
    price: 49.99,
    skillLevel: 'Beginner',
    industry: 'Education',
    thumbnail: 'https://picsum.photos/seed/tech1/800/450',
    views: 12500,
    duration: '12h 45m',
    contentType: 'learning',
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'AI in 2026: The Strategic Landscape for Enterprise',
    slug: 'ai-strategic-landscape',
    creatorId: 'c2',
    creatorName: 'Tactical Solutions',
    isVerified: true,
    topic: 'Artificial Intelligence',
    format: 'event',
    region: 'Pan-African',
    language: 'English',
    isLive: true,
    contentType: 'live',
    thumbnail: 'https://picsum.photos/seed/tech2/800/450',
    views: 8400,
    duration: 'LIVE',
    skillLevel: 'Intermediate',
    industry: 'Consultancy',
    createdAt: new Date()
  },
  {
    id: '3',
    title: 'Cybersecurity Mesh Architecture',
    slug: 'cyber-mesh',
    creatorId: 'c3',
    creatorName: 'SecureHub',
    isVerified: true,
    topic: 'Cybersecurity',
    format: 'video',
    region: 'International',
    language: 'French',
    price: 0,
    skillLevel: 'Advanced',
    industry: 'Security',
    thumbnail: 'https://picsum.photos/seed/tech3/800/450',
    views: 45000,
    duration: '45:20',
    contentType: 'video',
    createdAt: new Date()
  }
];

export const techService = {
  getContent: async (filters?: any): Promise<TechContent[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...MOCK_CONTENT];
    if (filters?.contentType) {
      filtered = filtered.filter(c => c.contentType === filters.contentType);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || c.topic.toLowerCase().includes(q));
    }
    
    return filtered;
  },

  getTrending: async (): Promise<TechContent[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...MOCK_CONTENT].sort((a, b) => b.views - a.views);
  }
};
