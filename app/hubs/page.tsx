import React from 'react';
import { useAppAuth } from '../../src/hooks/useAppAuth';
import { VerticalHubsPage } from '../../src/components/VerticalHubsPage';

export default function HubsDirectoryPage() {
  const { user, wallet, signInWithGoogle } = useAppAuth();

  const handleNavigateHub = (slug: string, inNewTab?: boolean) => {
    const url = slug === 'all-hubs' ? '/hubs' : `/hub/${slug}`;
    if (inNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };

  return (
    <VerticalHubsPage
      user={user}
      wallet={wallet}
      onNavigateHub={handleNavigateHub}
      onLogin={signInWithGoogle}
      onOpenCashier={() => {
        window.location.href = '/?cashier=open';
      }}
    />
  );
}
