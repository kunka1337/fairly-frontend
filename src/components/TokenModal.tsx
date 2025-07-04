"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { toast } from "sonner";
import { useWebSocketData } from "@/lib/websocket-context";
import { User, DollarSign, Activity, TrendingUp, Search, Globe, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimeAgo } from "@/hooks/use-time-ago";
import type { JupiterPool, SocialLinks, RewardsState, TokenModalProps } from '@/types/token';
import { TokenDataService } from '@/services/token-service';
import { 
    XLogo, 
    TelegramLogo, 
    JupiterLogo, 
    DexscreenerLogo, 
    AxiomLogo 
  } from './logos';

// Custom Hooks
function useTokenData(tokenId: string, isOpen: boolean) {
  const [poolData, setPoolData] = useState<JupiterPool | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
      setPoolData(null);
      setSocialLinks({});
      setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }

    if (!tokenId) return;

    let cancelled = false;
      
      const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const pool = await TokenDataService.fetchPoolData(tokenId);
        
        if (cancelled) return;

          if (pool) {
            setPoolData(pool);
            setSocialLinks({
              twitter: pool.baseAsset.twitter,
              telegram: pool.baseAsset.telegram,
              website: pool.baseAsset.website
            });
          } else {
            setError('Token not found');
          }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch token data:', error);
          setError('Failed to load token data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, isOpen]); // resetState is excluded intentionally as it's stable

  return { poolData, socialLinks, loading, error };
}

function useRewards(poolData: JupiterPool | null, isTokenBonded: boolean) {
  const [rewards, setRewards] = useState<RewardsState>({
    creator: null,
    amm: null,
    loading: { creator: false, amm: false },
    claiming: false,
    claimed: false
  });

  const updateRewards = useCallback((updates: Partial<RewardsState>) => {
    setRewards(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLoading = useCallback((type: 'creator' | 'amm', isLoading: boolean) => {
    setRewards(prev => ({
      ...prev,
      loading: { ...prev.loading, [type]: isLoading }
    }));
  }, []);

  useEffect(() => {
    if (!poolData) return;

    let cancelled = false;

    const fetchRewards = async () => {
      // Fetch creator rewards
      updateLoading('creator', true);
      try {
        const creatorRewards = await TokenDataService.fetchCreatorRewards(poolData.id, poolData.baseAsset.id);
        if (!cancelled) {
          updateRewards({ creator: creatorRewards });
        }
      } catch (error) {
        console.warn('Failed to fetch creator rewards (non-critical):', error);
      } finally {
        if (!cancelled) {
          updateLoading('creator', false);
        }
      }

      // Fetch AMM rewards only for bonded tokens
      if (isTokenBonded) {
        updateLoading('amm', true);
        try {
          const ammRewards = await TokenDataService.fetchAmmCreatorRewards(poolData.id, poolData.baseAsset.dev);
          if (!cancelled) {
            updateRewards({ amm: ammRewards });
          }
        } catch (error) {
          console.warn('Failed to fetch AMM creator rewards (non-critical):', error);
        } finally {
          if (!cancelled) {
            updateLoading('amm', false);
          }
        }
      }
    };

    fetchRewards();

    return () => {
      cancelled = true;
    };
  }, [poolData, isTokenBonded, updateRewards, updateLoading]);

  return { rewards, updateRewards };
}



// UI Components
function LoadingSkeleton() {
  return (
    <>
      {/* Header */}
            <div className="relative p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60">
              <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    <div className="flex items-center gap-3">
                      <div className="h-3.5 w-3.5 bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-3.5 bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-3.5 bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-3.5 bg-muted animate-pulse rounded" />
                      <div className="h-3.5 w-3.5 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonding Curve Progress */}
            <div className="px-4 sm:px-6 py-4 border-b border-border/60">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-8 bg-muted animate-pulse rounded" />
                </div>
                <div className="w-full h-2 bg-muted animate-pulse rounded-full" />
              </div>
            </div>

            {/* Description */}
            <div className="px-4 sm:px-6 py-4 border-b border-border/60">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>

            {/* Token Stats */}
            <div className="px-4 sm:px-6 py-4 border-b border-border/60">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                    <div>
                      <div className="h-3 w-16 bg-muted animate-pulse rounded mb-1" />
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                    <div>
                      <div className="h-3 w-16 bg-muted animate-pulse rounded mb-1" />
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                    <div>
                      <div className="h-3 w-12 bg-muted animate-pulse rounded mb-1" />
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-8 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                    <div>
                      <div className="h-3 w-24 bg-muted animate-pulse rounded mb-1" />
                      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

      {/* Creator */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-4 w-12 bg-muted animate-pulse rounded" />
              <div className="h-5 w-8 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="mt-1">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>

            {/* Creator Rewards */}
            <div className="px-4 sm:px-6 py-4 border-b border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex flex-row items-center justify-between gap-3">
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
                </div>
              </div>
            </div>

            {/* Trading Buttons */}
            <div className="px-4 sm:px-6 py-4 sm:pb-6">
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-muted animate-pulse rounded-lg" />
                <div className="flex-1 h-10 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          </>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
        <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
  );
}

function TokenHeader({ 
  poolData, 
  socialLinks, 
  timeAgo, 
  isTokenBonded,
  onCopy 
}: {
  poolData: JupiterPool;
  socialLinks: SocialLinks;
  timeAgo: string;
  isTokenBonded: boolean;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(poolData.baseAsset.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy(poolData.baseAsset.id);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
        <div className="relative p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <Image
                src={poolData.baseAsset.icon}
                alt={poolData.baseAsset.name}
                width={64}
                height={64}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl border-2 border-border object-cover"
                unoptimized={true}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">{poolData.baseAsset.symbol}</h2>
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">{poolData.baseAsset.name}</span>
                <button
              onClick={handleCopy}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground pr-1">{timeAgo} ago</div>
                  <div className="flex items-center gap-3">
                  <a
                      href={`https://x.com/search?q=${poolData.baseAsset.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                  </a>
                    <a
                href={`https://dexscreener.com/solana/${isTokenBonded ? poolData.id : poolData.baseAsset.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <DexscreenerLogo className="w-3.5 h-3.5" />
                    </a>
                    {socialLinks.website && (
                      <a
                        href={socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                    {socialLinks.twitter && (
                    <a
                        href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                        <XLogo className="w-3.5 h-3.5" />
                  </a>
                  )}
                    {socialLinks.telegram && (
                  <a
                        href={socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                        <TelegramLogo className="w-3.5 h-3.5" />
                  </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}

function BondingCurveProgress({ poolData, isTokenBonded }: { poolData: JupiterPool; isTokenBonded: boolean }) {
  const bondingCurveProgress = isTokenBonded ? 100 : (poolData.bondingCurve ?? 0);

  return (
        <div className="px-4 sm:px-6 py-4 border-b border-border/60">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bonding Curve Progress</span>
                <span className="font-medium">{Math.floor(bondingCurveProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.floor(bondingCurveProgress)}%` }}
              />
            </div>
          </div>
        </div>
  );
}

function TokenCreator({ poolData, isTokenDeployer }: { poolData: JupiterPool; isTokenDeployer: boolean }) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
        <div className="px-4 sm:px-6 py-4 border-b border-border/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Creator</h3>
            {isTokenDeployer && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                You
              </span>
            )}
          </div>
          <div className="mt-1">
            <a
              href={`https://solscan.io/account/${poolData.baseAsset.dev}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {formatAddress(poolData.baseAsset.dev)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function TokenStats({ poolData }: { poolData: JupiterPool }) {
  const transactions24h = (poolData.baseAsset.stats24h?.numBuys || 0) + (poolData.baseAsset.stats24h?.numSells || 0);

    return (
        <div className="px-4 sm:px-6 py-4 border-b border-border/60">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-3 sm:space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Market Cap</p>
                    <p className="text-sm font-medium">${Math.floor(poolData.baseAsset.mcap ?? 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                    <p className="text-sm font-medium">${Math.floor(poolData.volume24h ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <div className="flex items-center gap-1">
                      <p className="text-sm font-medium">${(poolData.baseAsset.usdPrice ?? 0).toFixed(6)}</p>
                    <span className={cn(
                      "text-xs",
                        (poolData.baseAsset.stats24h?.priceChange || 0) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                        {(poolData.baseAsset.stats24h?.priceChange || 0) >= 0 ? "+" : ""}{(poolData.baseAsset.stats24h?.priceChange || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">24h Transactions</p>
                    <p className="text-sm font-medium">{transactions24h.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}

function CreatorRewards({ 
  rewards, 
  isTokenBonded, 
  isTokenDeployer, 
  onClaimRewards 
}: {
  rewards: RewardsState;
  isTokenBonded: boolean;
  isTokenDeployer: boolean;
  onClaimRewards: () => void;
}) {
  return (
        <div className="px-4 sm:px-6 py-4 border-b border-border/60">
          <div className={cn(
            "grid gap-3 sm:gap-6",
        isTokenBonded ? "grid-cols-2 divide-x divide-border/60" : "grid-cols-1"
          )}>
            {/* DBC Creator Rewards */}
            <div className={cn(
              "space-y-2 sm:space-y-3",
          isTokenBonded ? "pr-3 sm:pr-6" : ""
            )}>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                DBC Creator Rewards
          </h3>
          {isTokenBonded ? (
                <div className="flex flex-col gap-2 sm:gap-3">
              {rewards.loading.creator || rewards.creator === null ? (
                    <div className="h-5 sm:h-6 w-20 sm:w-24 bg-muted animate-pulse rounded" />
                  ) : (
                <span className="text-lg sm:text-xl font-bold text-primary">{rewards.creator.toFixed(3)} SOL</span>
                  )}
              {rewards.loading.creator || rewards.creator === null ? (
                    <div className="h-6 sm:h-7 w-12 sm:w-16 bg-muted animate-pulse rounded-lg" />
                  ) : (
                    <button 
                  onClick={onClaimRewards}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                  disabled={rewards.claiming || rewards.claimed || rewards.creator === 0 || !isTokenDeployer}
                    >
                  {rewards.claimed ? "Claimed!" : (rewards.claiming ? "Claiming..." : "Claim")}
              </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
              {rewards.loading.creator || rewards.creator === null ? (
                    <div className="h-5 sm:h-6 w-20 sm:w-24 bg-muted animate-pulse rounded" />
                  ) : (
                <span className="text-lg sm:text-xl font-bold text-primary">{rewards.creator.toFixed(3)} SOL</span>
                  )}
              {rewards.loading.creator || rewards.creator === null ? (
                    <div className="h-6 sm:h-7 w-12 sm:w-16 bg-muted animate-pulse rounded-lg" />
                  ) : (
                    <button 
                  onClick={onClaimRewards}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  disabled={rewards.claiming || rewards.claimed || rewards.creator === 0 || !isTokenDeployer}
                    >
                  {rewards.claimed ? "Claimed!" : (rewards.claiming ? "Claiming..." : "Claim")}
              </button>
                  )}
                </div>
              )}
            </div>

            {/* AMM Creator Rewards - Only show for bonded tokens */}
        {isTokenBonded && (
              <div className="space-y-2 sm:space-y-3 pl-3 sm:pl-6">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  AMM Creator Rewards
                </h3>
                <div className="flex flex-col gap-2 sm:gap-3">
              {rewards.loading.amm || rewards.amm === null ? (
                    <div className="h-5 sm:h-6 w-20 sm:w-24 bg-muted animate-pulse rounded" />
                  ) : (
                <span className="text-lg sm:text-xl font-bold text-primary">{rewards.amm.toFixed(3)} SOL</span>
                  )}
              {rewards.loading.amm || rewards.amm === null ? (
                    <div className="h-6 sm:h-7 w-12 sm:w-16 bg-muted animate-pulse rounded-lg" />
                  ) : (
                    <button 
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                  disabled={rewards.amm === 0 || !isTokenDeployer}
                    >
                      Claim
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
  );
}

function TradingButtons({ poolData }: { poolData: JupiterPool }) {
  return (
        <div className="px-4 sm:px-6 py-4 sm:pb-6">
          <div className="flex gap-2">
            <a
                href={`https://axiom.trade/t/${poolData.baseAsset.id}/@fairly`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
                    <button className="w-full h-10 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium border bg-primary text-primary-foreground hover:bg-primary/90 border-border">
            <AxiomLogo className="w-4 h-4" />
            <span>Buy on Axiom</span>
          </button>
            </a>
            <a
                href={`https://jup.ag/swap/So11111111111111111111111111111111111111112-${poolData.baseAsset.id}`}
              target="_blank"
              rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium"
        >
          <JupiterLogo className="w-4 h-4" />
          <span>Buy on Jupiter</span>
        </a>
          </div>
        </div>
  );
}

// Main Component
export default function TokenCardModal({ 
  tokenId, 
  isOpen = false, 
  onOpenChange 
}: TokenModalProps) {
  const { poolData, socialLinks, loading, error } = useTokenData(tokenId, isOpen);
  const { publicKey, signTransaction } = useWallet();
  const wsData = useWebSocketData();

  // Determine if token is bonded/graduated
  const isTokenBonded = useMemo(() => {
    if (!poolData) return false;
    
    // Check if token is in graduated list from websocket
    if (wsData) {
      const isInGraduatedList = wsData.graduated.some((token: any) => 
        token.pool?.baseAsset?.id === tokenId || 
        token.id === tokenId
      );
      if (isInGraduatedList) return true;
    }
    
    // Check if token has graduatedAt field (indicating it's bonded)
    if (poolData.baseAsset?.graduatedAt || poolData.graduatedAt) {
      return true;
    }
    
    // Check if bondingCurve is already 100
    if (poolData.bondingCurve >= 100) {
      return true;
    }
    
    return false;
  }, [poolData, wsData, tokenId]);

  const { rewards, updateRewards } = useRewards(poolData, isTokenBonded);

  // Check if connected wallet is the token deployer
  const isTokenDeployer = useMemo(() => {
    if (!publicKey || !poolData) return false;
    return publicKey.toString() === poolData.baseAsset.dev;
  }, [publicKey, poolData]);

  const timeAgo = useTimeAgo(poolData?.createdAt);

  // Merge WebSocket data with poolData for real-time updates
  const activePoolData = useMemo(() => {
    if (!poolData || !wsData || !tokenId) return poolData;

    const allTokens = [...wsData.recent, ...wsData.aboutToGraduate, ...wsData.graduated];
    const wsToken = allTokens.find((token: any) => 
      token.pool?.baseAsset?.id === tokenId || 
      token.id === tokenId
    );

    if (!wsToken || !wsToken.pool) return poolData;

    // Merge WebSocket data with poolData
    const wsNumBuys = wsToken.pool?.baseAsset?.stats24h?.numBuys ?? 0;
    const wsNumSells = wsToken.pool?.baseAsset?.stats24h?.numSells ?? 0;
    
    return {
      ...poolData,
      volume24h: wsToken.volume ?? poolData.volume24h,
      baseAsset: {
        ...poolData.baseAsset,
        mcap: wsToken.marketCap ?? poolData.baseAsset.mcap,
        fdv: wsToken.marketCap ?? poolData.baseAsset.fdv,
        usdPrice: wsToken.pool?.baseAsset?.usdPrice ?? poolData.baseAsset.usdPrice,
        stats24h: poolData.baseAsset.stats24h ? {
          ...poolData.baseAsset.stats24h,
          priceChange: wsToken.pool?.baseAsset?.stats24h?.priceChange ?? poolData.baseAsset.stats24h.priceChange,
          numBuys: wsNumBuys,
          numSells: wsNumSells,
        } : {
          priceChange: wsToken.pool?.baseAsset?.stats24h?.priceChange ?? 0,
          holderChange: 0,
          liquidityChange: 0,
          buyVolume: 0,
          sellVolume: 0,
          buyOrganicVolume: 0,
          sellOrganicVolume: 0,
          numBuys: wsNumBuys,
          numSells: wsNumSells,
          numTraders: 0,
        }
      }
    };
  }, [poolData, wsData, tokenId]);

  // Claim creator trading fees
  const handleClaimRewards = useCallback(async () => {
    if (!activePoolData || !publicKey || !signTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    if (!isTokenDeployer) {
      toast.error("Only the token deployer can claim rewards");
      return;
    }

    if (rewards.creator === null || rewards.creator === 0) {
      toast.error("No rewards to claim");
      return;
    }

    updateRewards({ claiming: true, claimed: false });
    
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
      if (!rpcUrl) {
        throw new Error('RPC URL not configured');
      }
      
      const connection = new Connection(rpcUrl);
      const client = DynamicBondingCurveClient.create(connection);
      
      let meteoraPoolPublicKey: PublicKey;
      
      try {
        const poolByMint = await client.state.getPoolByBaseMint(activePoolData.baseAsset.id);
        if (poolByMint) {
          meteoraPoolPublicKey = poolByMint.publicKey;
        } else {
          meteoraPoolPublicKey = new PublicKey(activePoolData.id);
        }
      } catch (lookupError) {
        meteoraPoolPublicKey = new PublicKey(activePoolData.id);
      }

      const claimParams = {
        creator: publicKey,
        payer: publicKey,
        pool: meteoraPoolPublicKey,
        maxBaseAmount: new BN('18446744073709551615'),
        maxQuoteAmount: new BN('18446744073709551615'),
        receiver: publicKey,
      };

      try {
        const transaction = await client.creator.claimCreatorTradingFee(claimParams);
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        
        let signedTransaction;
        try {
          signedTransaction = await signTransaction(transaction);
        } catch (signError: any) {
          if (signError.message?.includes('User rejected') || 
              signError.message?.includes('rejected the request') ||
              signError.message?.includes('Transaction was rejected') ||
              signError.message?.includes('User denied transaction') ||
              signError.message?.includes('cancelled') ||
              signError.name === 'WalletSignTransactionError' ||
              signError.name === 'UserRejectedRequestError' ||
              signError.code === 4001) {
            toast.error("Transaction cancelled by user");
            return;
          }
          throw signError;
        }
        
        try {
          const signature = await connection.sendRawTransaction(signedTransaction.serialize());
          await connection.confirmTransaction(signature, 'confirmed');
          
          toast.success("Creator rewards claimed successfully!");
          
          try {
            await connection.confirmTransaction(signature, 'finalized');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const updatedRewards = await TokenDataService.fetchCreatorRewards(activePoolData.id, activePoolData.baseAsset.id);
            updateRewards({ creator: updatedRewards, claimed: true });
            
          } catch (refreshError) {
            console.warn('Failed to refresh creator rewards after finalization:', refreshError);
            TokenDataService.fetchCreatorRewards(activePoolData.id, activePoolData.baseAsset.id)
              .then(newRewards => updateRewards({ creator: newRewards }))
              .catch(error => console.warn('Failed to refresh creator rewards (fallback):', error));
          }
            
        } catch (networkError: any) {
          throw networkError;
        }
      } catch (claimError: any) {
        if (claimError.message?.includes('account discriminator')) {
          toast.error("This token is not using Meteora protocol or pool not found");
        } else if (claimError.message?.includes('insufficient funds')) {
          toast.error("Insufficient SOL for transaction fees");
        } else {
          throw claimError;
        }
      }
    } catch (error: any) {
      console.error('Failed to claim creator rewards:', error);
      toast.error(error.message || "Failed to claim rewards");
    } finally {
      updateRewards({ claiming: false });
    }
  }, [activePoolData, publicKey, signTransaction, isTokenDeployer, rewards.creator, updateRewards]);

  const handleCopy = useCallback((_text: string) => {
    // Copy feedback is handled in TokenHeader
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-[500px] max-h-[calc(100%-4rem)] overflow-y-auto rounded-xl">
        <DialogTitle className="sr-only">
          {activePoolData ? `Token Details: ${activePoolData.baseAsset.name}` : 'Loading Token Data'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {activePoolData ? `${activePoolData.baseAsset.name} token information` : 'Loading token information'}
        </DialogDescription>
        
        {loading && <LoadingSkeleton />}
        
        {error && <ErrorState error={error} />}
        
        {activePoolData && !loading && !error && (
          <>
            <TokenHeader 
              poolData={activePoolData} 
              socialLinks={socialLinks} 
              timeAgo={timeAgo} 
              isTokenBonded={isTokenBonded}
              onCopy={handleCopy}
            />
            <BondingCurveProgress poolData={activePoolData} isTokenBonded={isTokenBonded} />
            <TokenCreator poolData={activePoolData} isTokenDeployer={isTokenDeployer} />
            <TokenStats poolData={activePoolData} />
            <CreatorRewards 
              rewards={rewards} 
              isTokenBonded={isTokenBonded} 
              isTokenDeployer={isTokenDeployer} 
              onClaimRewards={handleClaimRewards} 
            />
            <TradingButtons poolData={activePoolData} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
