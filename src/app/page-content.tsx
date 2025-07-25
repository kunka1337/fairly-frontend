"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Clock,
  Zap,
  Shield,
  Pause,
  Search,
  Copy,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { TokenCardSkeleton } from "@/components/skeletons";
import TokenModal from "@/components/TokenModal";
import { useTimeAgo } from "@/hooks/use-time-ago";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useWebSocketData, TokenWithPool } from "@/lib/websocket-context";
import { useSearchParams, useRouter } from "next/navigation";
import { prettifyNumber, getTotalTransactions } from "@/lib/token-utils";
import { XLogo, TelegramLogo } from "@/components/logos";

// prettifyNumber is now imported from token-utils

// AnimatedNumber: animates count up only if prettified value changes
const AnimatedNumber = ({ value }: { value: number }) => {
  const { motion, useAnimation } = require('framer-motion');
  const controls = useAnimation();
  const prevValue = useRef(value);
  const prevPretty = useRef(prettifyNumber(value));
  const [display, setDisplay] = React.useState(value);

  useEffect(() => {
    const newPretty = prettifyNumber(value);
    if (newPretty !== prevPretty.current) {
      controls.start({ val: value, transition: { duration: 0.6, ease: "easeOut" } });
      prevPretty.current = newPretty;
    } else {
      setDisplay(value);
    }
    prevValue.current = value;
  }, [value, controls]);

  return (
    <motion.span
      initial={false}
      animate={controls}
      onUpdate={(latest: { val: number }) => setDisplay(latest.val)}
      val={prevValue.current}
    >
      {prettifyNumber(display)}
    </motion.span>
  );
};

const TokenCard = ({ 
  token, 
  setHoveredSection, 
  className = "", 
  onModalStateChange 
}: { 
  token: TokenWithPool; 
  setHoveredSection: (category: string | null) => void; 
  className?: string;
  onModalStateChange?: (tokenId: string, isOpen: boolean) => void;
}) => {
  const { theme } = useTheme();
  const timeAgo = useTimeAgo(token.createdAt);
  const ringRadius = 27;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (token.progress / 100) * circumference;

  // Check if this is the priority token
  const priorityTokenId = process.env.NEXT_PUBLIC_CA;
  const isPriorityToken = priorityTokenId && (
    token.pool.baseAsset.id === priorityTokenId || 
    token.id === priorityTokenId
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(token.pool.baseAsset.id);
    toast("Copied!");
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) {
      return;
    }
    // Only update URL - let global modal handle the rest
    onModalStateChange?.(token.pool.baseAsset.id, true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card
        className={cn(
          "p-2 border-border hover:border-primary/50 transition-all duration-300 cursor-pointer relative hover:z-10",
          theme === "dark" ? "bg-[#171717]" : "bg-card"
        )}
        onMouseEnter={() => setHoveredSection(token.category)}
        onMouseLeave={() => setHoveredSection(null)}
        onClick={handleCardClick}
      >
        {/* OG Indicator */}
        {isPriorityToken && (
          <div className="absolute top-1 right-1 z-10">
            <div className="bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-teal-400/20">
              OG
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
              {token.image ? (
                <Image 
                  src={token.image} 
                  alt={token.name} 
                  width={48}
                  height={48}
                  className="w-full h-full object-cover" 
                  unoptimized={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  {token.symbol}
                </div>
              )}
            </div>
            <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={ringRadius} fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/20 dark:text-white/40" />
              <motion.circle
                cx="28"
                cy="28"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="text-primary transition-all duration-500"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-foreground text-xs truncate">{token.symbol}</div>
              <button onClick={handleCopy} aria-label="Copy token ID" className="flex items-center gap-1 group">
                <div className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">{token.name}</div>
                <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center flex-grow">
                <div className="text-xs text-muted-foreground pr-1">{timeAgo}</div>
                <a href={`https://x.com/search?q=${token.id}`} target="_blank" rel="noopener noreferrer" aria-label="Search on X">
                  <Search className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors" />
                </a>
                {/* Social Links */}
                <div className="flex items-center gap-1 ml-1">
                  {token.pool.baseAsset.website && (
                    <a
                      href={token.pool.baseAsset.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Visit website"
                    >
                      <Globe className="w-3 h-3" />
                    </a>
                  )}
                  {token.pool.baseAsset.twitter && (
                    <a
                      href={token.pool.baseAsset.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="View on X"
                    >
                      <XLogo className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {token.pool.baseAsset.telegram && (
                    <a
                      href={token.pool.baseAsset.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Join Telegram"
                    >
                      <TelegramLogo className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>TX: <span className="font-bold text-foreground">{getTotalTransactions(token.pool)}</span></span>
                  <span>V: <span className="font-bold text-foreground"><AnimatedNumber value={token.volume} /></span></span>
                  <span>MC: <span className="font-bold text-foreground"><AnimatedNumber value={token.marketCap} /></span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const TradePageContent = () => {
  // Use WebSocket subscription for live data
  const webSocketData = useWebSocketData();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'soon' | 'bonded'>('new');
  
  // Derive modal state from URL parameter (single source of truth)
  const globalModalTokenId = searchParams.get('token');
  const isGlobalModalOpen = !!globalModalTokenId;

  // Handle URL updates when modals open/close
  const handleModalStateChange = (tokenId: string, isOpen: boolean) => {
    if (isOpen) {
      // Add token parameter to URL when modal opens
      const params = new URLSearchParams(searchParams.toString());
      params.set('token', tokenId);
      router.push(`?${params.toString()}`, { scroll: false });
    } else {
      // Remove token parameter from URL when modal closes
      const params = new URLSearchParams(searchParams.toString());
      params.delete('token');
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      router.push(newUrl, { scroll: false });
    }
  };

  // Handle global modal close (when closed via Dialog mechanisms)
  const handleGlobalModalClose = (open: boolean) => {
    if (!open) {
      // Clear URL parameter when modal is closed - this is the only state update needed
      const params = new URLSearchParams(searchParams.toString());
      params.delete('token');
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      router.push(newUrl, { scroll: false });
    }
  };

  // Set loading to false once we have any data  
  useEffect(() => {
    if (webSocketData.recent.length > 0 || webSocketData.aboutToGraduate.length > 0 || webSocketData.graduated.length > 0) {
      setLoading(false);
    }
  }, [webSocketData.recent.length, webSocketData.aboutToGraduate.length, webSocketData.graduated.length]);

  // --- Responsive tokens for mobile tab ---
  const getCurrentTokens = useCallback(() => {
    switch (activeTab) {
      case 'new': return webSocketData.recent;
      case 'soon': return webSocketData.aboutToGraduate;
      case 'bonded': return webSocketData.graduated;
    }
  }, [activeTab, webSocketData]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 h-full flex flex-col">
      {/* Mobile Content Wrapper */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Tabs for Mobile */}
        <div className="mb-4 lg:mb-6">
          <div className="flex bg-muted rounded-lg p-1">
            <button onClick={() => setActiveTab('new')} className={`flex-1 flex items-center justify-center py-2 px-3 gap-2 rounded-md text-sm font-medium transition-all ${activeTab === 'new' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Zap className="w-4 h-4" /> New</button>
            <button onClick={() => setActiveTab('soon')} className={`flex-1 flex items-center justify-center py-2 px-3 gap-2 rounded-md text-sm font-medium transition-all ${activeTab === 'soon' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Clock className="w-4 h-4" /> Soon</button>
            <button onClick={() => setActiveTab('bonded')} className={`flex-1 flex items-center justify-center py-2 px-3 gap-2 rounded-md text-sm font-medium transition-all ${activeTab === 'bonded' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Shield className="w-4 h-4" /> Bonded</button>
          </div>
        </div>
        {/* Token List Mobile */}
        <div className="flex-grow space-y-2 overflow-y-auto lg:mt-3">
          <AnimatePresence>
            {loading ? (
              // Show skeleton cards while loading
              Array.from({ length: 8 }, (_, idx) => (
                <div key={`mobile-skeleton-${idx}`}>
                  <TokenCardSkeleton />
                </div>
              ))
            ) : (
              getCurrentTokens().map(token => <TokenCard key={token.pool.id} token={token} setHoveredSection={setHoveredSection} onModalStateChange={handleModalStateChange} />)
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Desktop Grid */}
      <div className="hidden lg:grid grid-cols-3 gap-6 h-full">
        {/* New */}
        <div className="flex flex-col space-y-2 overflow-hidden">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> New {hoveredSection === 'new' && <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/90 text-white text-xs font-medium rounded-md"><Pause className="w-3 h-3" /> Paused</div>}</h2>
          <div className="flex-grow space-y-2 overflow-y-auto pr-2 pb-2">
            {loading ? (
              // Show skeleton cards while loading
              Array.from({ length: 8 }, (_, idx) => (
                <div key={`new-skeleton-${idx}`} className={`${idx === 0 ? 'mt-2' : ''} ${idx === 7 ? 'mb-4' : ''}`}>
                  <TokenCardSkeleton />
                </div>
              ))
            ) : (
              webSocketData.recent.map((token, idx, arr) => {
                let className = '';
                if (idx === 0) className += 'mt-2 ';
                if (idx === arr.length - 1) className += 'mb-4';
                return <TokenCard key={token.pool.id} token={token} setHoveredSection={setHoveredSection} className={className.trim()} onModalStateChange={handleModalStateChange} />;
              })
            )}
          </div>
        </div>
        {/* Soon */}
        <div className="flex flex-col space-y-2 overflow-hidden">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Clock className="w-5 h-5 text-muted-foreground" /> Soon {hoveredSection === 'soon' && <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/90 text-white text-xs font-medium rounded-md"><Pause className="w-3 h-3" /> Paused</div>}</h2>
          <div className="flex-grow space-y-2 overflow-y-auto pr-2 pb-2">
            {loading ? (
              // Show skeleton cards while loading
              Array.from({ length: 8 }, (_, idx) => (
                <div key={`soon-skeleton-${idx}`} className={`${idx === 0 ? 'mt-2' : ''} ${idx === 7 ? 'mb-4' : ''}`}>
                  <TokenCardSkeleton />
                </div>
              ))
            ) : (
              webSocketData.aboutToGraduate.map((token, idx, arr) => {
                let className = '';
                if (idx === 0) className += 'mt-2 ';
                if (idx === arr.length - 1) className += 'mb-4';
                return <TokenCard key={token.pool.id} token={token} setHoveredSection={setHoveredSection} className={className.trim()} onModalStateChange={handleModalStateChange} />;
              })
            )}
          </div>
        </div>
        {/* Bonded */}
        <div className="flex flex-col space-y-2 overflow-hidden">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Shield className="w-5 h-5 text-muted-foreground" /> Bonded {hoveredSection === 'bonded' && <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/90 text-white text-xs font-medium rounded-md"><Pause className="w-3 h-3" /> Paused</div>}</h2>
          <div className="flex-grow space-y-2 overflow-y-auto pr-2 pb-2">
            {loading ? (
              // Show skeleton cards while loading
              Array.from({ length: 8 }, (_, idx) => (
                <div key={`bonded-skeleton-${idx}`} className={`${idx === 0 ? 'mt-2' : ''} ${idx === 7 ? 'mb-4' : ''}`}>
                  <TokenCardSkeleton />
                </div>
              ))
            ) : (
              webSocketData.graduated.map((token, idx, arr) => {
                let className = '';
                if (idx === 0) className += 'mt-2 ';
                if (idx === arr.length - 1) className += 'mb-4';
                return <TokenCard key={token.pool.id} token={token} setHoveredSection={setHoveredSection} className={className.trim()} onModalStateChange={handleModalStateChange} />;
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Global TokenModal for URL parameters */}
      {globalModalTokenId && (
        <TokenModal
          tokenId={globalModalTokenId}
          isOpen={isGlobalModalOpen}
          onOpenChange={handleGlobalModalClose}
        />
      )}
    </div>
  );
};

export default TradePageContent; 