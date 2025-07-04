'use client';

import React, { useEffect, useState } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import BottomNavigation, { NavigationTab } from '@/components/BottomNavigation';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';

// Import the actual page components
import TradePageContent from '@/app/page-content';
import CreateTokenPageContent from '@/app/create-token/page-content';
import MyTokensPageContent from '@/app/my-tokens/page-content';

const MobileApp = () => {
  const { activeTab, setActiveTab } = useNavigation();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Set initial tab based on current route
    if (pathname === '/my-tokens') {
      setActiveTab('my-tokens');
    } else if (pathname === '/create-token') {
      setActiveTab('create');
    } else if (pathname === '/') {
      setActiveTab('trade');
    }
  }, [pathname, setActiveTab, mounted]);

  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'trade':
        return <TradePageContent />;
      case 'create':
        return <CreateTokenPageContent />;
      case 'my-tokens':
        return <MyTokensPageContent />;
      default:
        return <TradePageContent />;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </main>
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
    </div>
  );
};

export default MobileApp; 