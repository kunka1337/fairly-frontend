import React from 'react';
import { Zap, Rocket, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavigationTab = 'trade' | 'create' | 'my-tokens';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const tabs = [
    {
      id: 'trade' as const,
      label: 'Trade',
      icon: Zap,
    },
    {
      id: 'create' as const,
      label: 'Create',
      icon: Rocket,
    },
    {
      id: 'my-tokens' as const,
      label: 'My Tokens',
      icon: Coins,
    },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="safe-area-inset-bottom pb-3">
        <div className="flex h-16 px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center space-y-0.5 transition-all duration-200 active:scale-95",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive && "scale-110"
                  )} 
                />
                <span 
                  className={cn(
                    "text-[10px] font-medium transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-70"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation; 