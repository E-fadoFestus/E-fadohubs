import React from 'react';
import { useAppAuth } from '../../../src/hooks/useAppAuth';
import { UniversalHubPage } from '../../../src/components/UniversalHubPage';

interface DynamicHubPageProps {
  params?: { slug: string } | Promise<{ slug: string }>;
}

export default function DynamicHubPage({ params }: DynamicHubPageProps) {
  const { user, wallet, signInWithGoogle } = useAppAuth();
  
  // Extract slug from route params or window location
  let slug = 'arena';
  if (params && 'slug' in params && typeof params.slug === 'string') {
    slug = params.slug;
  } else if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const hubIdx = parts.indexOf('hub');
    if (hubIdx !== -1 && parts[hubIdx + 1]) {
      slug = parts[hubIdx + 1];
    }
  }

  const handleNavigateHub = (targetSlug: string, inNewTab?: boolean) => {
    const url = targetSlug === 'all-hubs' ? '/hubs' : `/hub/${targetSlug}`;
    if (inNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };

  return (
    <UniversalHubPage
      slug={slug}
      user={user}
      wallet={wallet}
      onNavigateHub={handleNavigateHub}
      onLogin={signInWithGoogle}
      onResult={(win, gameId, stake) => {
        console.log(`[Hub Game Result] ${gameId}: stake=${stake}, win=${win}`);
      }}
      onOpenCashier={() => {
        window.location.href = '/?cashier=open';
      }}
    />
  );
}
