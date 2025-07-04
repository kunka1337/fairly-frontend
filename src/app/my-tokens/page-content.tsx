"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import { AnimatePresence } from 'framer-motion';
import { TokenCardSkeletonMyTokens } from '@/components/skeletons';
import { Card } from '@/components/ui/card';
import { motion } from "framer-motion";
import { Copy, Globe } from "lucide-react";
import TokenModal from "@/components/TokenModal";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useWebSocketData, TokenWithPool } from "@/lib/websocket-context";
import { useWallet } from "@solana/wallet-adapter-react";
import { XLogo, TelegramLogo, AxiomLogo } from "@/components/logos";
import { useSearchParams, useRouter } from "next/navigation";
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { CpAmm } from "@meteora-ag/cp-amm-sdk";
import { Connection } from '@solana/web3.js';
import { CONSTANTS } from '@/lib/token-utils';
import { JupiterPoolResponse } from '@/types/token';

const NEXT_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

// Extended interface to include social links from database
interface FairlyTokenWithPool extends TokenWithPool {
  description?: string | null | undefined;
  website?: string | null | undefined;
  twitter?: string | null | undefined;
  telegram?: string | null | undefined;
}

const TokenCard = ({
  token,
  className = "",
  onModalStateChange
}: {
  token: FairlyTokenWithPool;
  className?: string;
  onModalStateChange?: (tokenId: string, isOpen: boolean) => void;
}) => {
  const { theme } = useTheme();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          "p-4 border-border hover:border-primary/50 transition-all duration-300 cursor-pointer relative hover:z-10",
          "sm:p-3", // Smaller padding on desktop
          theme === "dark" ? "bg-[#171717]" : "bg-card"
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Token Image */}
          <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-muted border border-border">
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
                <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm text-muted-foreground font-medium">
                  {token.symbol}
                </div>
              )}
            </div>
          </div>

          {/* Token Info */}
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="font-bold text-foreground text-sm sm:text-base truncate">{token.symbol}</div>
              <div className="flex items-center gap-2">
                <div className="text-xs sm:text-sm text-muted-foreground truncate">{token.name}</div>
                <button 
                  onClick={handleCopy} 
                  aria-label="Copy token ID" 
                  className="group p-1 -m-1" // Larger touch target
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 ml-2">
              {/* Trading Link */}
              <a
                href={`https://axiom.trade/t/${token.pool.baseAsset.id}/@fairly`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1" // Larger touch target
                onClick={(e) => e.stopPropagation()}
                title="Trade on Axiom"
              >
                <AxiomLogo className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>

              {/* Social Links */}
              {token.website && (
                <a
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1" // Larger touch target
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              )}
              {token.twitter && (
                <a
                  href={token.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1" // Larger touch target
                  onClick={(e) => e.stopPropagation()}
                >
                  <XLogo className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              )}
              {token.telegram && (
                <a
                  href={token.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1" // Larger touch target
                  onClick={(e) => e.stopPropagation()}
                >
                  <TelegramLogo className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const MyTokensPageContent = () => {
  const [tokens, setTokens] = useState<FairlyTokenWithPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webSocketData = useWebSocketData();
  const { publicKey, connected } = useWallet();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('MyTokensPageContent mounted');
    console.log('Connected:', connected);
    console.log('Public key:', publicKey?.toBase58());
  }, [connected, publicKey]);

  // Use ref to store base tokens (fetched from API) to avoid circular dependency
  const baseTokensRef = useRef<FairlyTokenWithPool[]>([]);

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

  useEffect(() => {
    const fetchTokens = async () => {
      if (!connected || !publicKey) {
        setTokens([]);
        baseTokensRef.current = [];
        setLoading(false);
        return;
      }

      const connection = new Connection(NEXT_PUBLIC_RPC_URL as string, 'confirmed');
      const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed');
      const ammClient = new CpAmm(connection);

      try {
        setLoading(true);
        setError(null);

        const [dbcPools, ammPools] = await Promise.all([
          dbcClient.state.getPoolsFeesByCreator(publicKey.toBase58()).then(ps => Promise.all([...ps].map(p => dbcClient.state.getPool(p.poolAddress).then(p => p.baseMint)))),
          ammClient.getPositionsByUser(publicKey).then(ps => ps.map(p => p.positionState.pool))
        ])

        const response = await fetch(
          `${CONSTANTS.API_ENDPOINTS.JUPITER_POOL_DATA}?poolIds=${[...dbcPools, ...ammPools].join(",")}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: JupiterPoolResponse = await response.json();

        const tokens: FairlyTokenWithPool[] = data.pools.map((pool) => ({
          id: pool.id,
          pool,
          name: pool.baseAsset.name,
          symbol: pool.baseAsset.symbol,
          marketCap: pool.baseAsset.mcap,
          volume: 0,
          progress: 0,
          category: 'new',
          image: pool.baseAsset.icon,
          createdAt: pool.baseAsset.firstPool.createdAt,
          website: pool.baseAsset.website,
          twitter: pool.baseAsset.twitter,
          telegram: pool.baseAsset.telegram,
        }))
        console.log(tokens)

        baseTokensRef.current = tokens;
        setTokens(tokens);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
        setError('Failed to load your tokens. Please try again.');
        setTokens([]);
        baseTokensRef.current = [];
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [connected, publicKey]);

  // Update tokens with real-time data from WebSocket
  // Fixed: Removed tokens from dependency array to prevent infinite loop
  useEffect(() => {
    if (baseTokensRef.current.length === 0) return;

    // Merge WebSocket data with user tokens to get real-time updates
    const allWebSocketTokens = [
      ...webSocketData.recent,
      ...webSocketData.aboutToGraduate,
      ...webSocketData.graduated
    ];

    const updatedTokens = baseTokensRef.current.map(userToken => {
      const liveToken = allWebSocketTokens.find(
        wsToken => wsToken.id === userToken.id || wsToken.pool?.id === userToken.pool?.id
      );

      // Preserve social links from database while updating live data
      return liveToken ? {
        ...userToken,
        ...liveToken,
        // Keep the social links from database
        website: userToken.website,
        twitter: userToken.twitter,
        telegram: userToken.telegram,
        description: userToken.description
      } : userToken;
    });

    setTokens(updatedTokens);
  }, [webSocketData]); // Only webSocketData in dependency array

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 sm:mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Tokens</h1>
      </div>

      <div className="flex-grow space-y-3 sm:space-y-2 overflow-y-auto pr-1 sm:pr-2 pb-2">
        {!connected ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h2 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Please connect your wallet to view your tokens
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h2 className="text-lg sm:text-xl font-semibold text-red-500 mb-2">
              Error
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {error}
            </p>
          </div>
        ) : loading ? (
          // Show skeleton cards while loading
          Array.from({ length: 6 }, (_, idx) => (
            <div key={`my-tokens-skeleton-${idx}`} className={`${idx === 0 ? 'mt-2' : ''} ${idx === 5 ? 'mb-4' : ''}`}>
              <TokenCardSkeletonMyTokens />
            </div>
          ))
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h2 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2">
              No Tokens Found
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              You haven't created any tokens yet
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {tokens.map((token, idx, arr) => {
              let className = '';
              if (idx === 0) className += 'mt-2 ';
              if (idx === arr.length - 1) className += 'mb-4';
              return <TokenCard key={token.id} token={token} className={className.trim()} onModalStateChange={handleModalStateChange} />;
            })}
          </AnimatePresence>
        )}
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

export default MyTokensPageContent; 