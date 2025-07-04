import React from "react";
import { DollarSign, Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JupiterPool } from '@/types/token';
import { getTotalTransactions } from '@/lib/token-utils';

interface TokenStatsProps {
  poolData: JupiterPool;
}

export const TokenStats: React.FC<TokenStatsProps> = ({ poolData }) => {
  const transactions24h = getTotalTransactions(poolData);

  return (
    <div className="px-4 sm:px-6 py-4 border-b border-border/60">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-3 sm:space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-medium">
                ${Math.floor(poolData.baseAsset.mcap ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">24h Volume</p>
              <p className="text-sm font-medium">
                ${Math.floor(poolData.volume24h ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium">
                  ${(poolData.baseAsset.usdPrice ?? 0).toFixed(6)}
                </p>
                <span className={cn(
                  "text-xs",
                  (poolData.baseAsset.stats24h?.priceChange || 0) >= 0 
                    ? "text-green-500" 
                    : "text-red-500"
                )}>
                  {(poolData.baseAsset.stats24h?.priceChange || 0) >= 0 ? "+" : ""}
                  {(poolData.baseAsset.stats24h?.priceChange || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">24h Transactions</p>
              <p className="text-sm font-medium">
                {transactions24h.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 