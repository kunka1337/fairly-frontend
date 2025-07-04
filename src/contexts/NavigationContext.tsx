'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { NavigationTab } from '@/components/BottomNavigation';

interface NavigationContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isMobileNavigation: boolean;
  setIsMobileNavigation: (value: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('trade');
  const [isMobileNavigation, setIsMobileNavigation] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Use a more reliable mobile detection
      const isMobile = window.innerWidth < 768; // md breakpoint instead of sm
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUserAgent = /mobile|android|iphone|ipad|phone/i.test(userAgent);
      
      const shouldUseMobile = isMobile || isMobileUserAgent;
      
      console.log('Mobile check:', { 
        width: window.innerWidth, 
        isMobile, 
        isMobileUserAgent,
        shouldUseMobile 
      });
      
      setIsMobileNavigation(shouldUseMobile);
    };

    // Check on mount
    checkMobile();
    setMounted(true);
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isMobileNavigation,
        setIsMobileNavigation,
      }}
    >
      {mounted ? children : (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )}
    </NavigationContext.Provider>
  );
}; 