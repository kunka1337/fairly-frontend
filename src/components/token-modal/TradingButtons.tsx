import React from "react";
import { JupiterLogo, AxiomLogo } from '../logos';
import type { JupiterPool } from '@/types/token';
import { getTokenLinks } from '@/lib/token-utils';

interface TradingButtonsProps {
  poolData: JupiterPool;
}

export const TradingButtons: React.FC<TradingButtonsProps> = ({ poolData }) => {
  const links = getTokenLinks(poolData.baseAsset.id, poolData.id);

  return (
    <div className="px-4 sm:px-6 py-4 sm:pb-6">
      <div className="flex gap-2">
        <a
          href={links.axiom}
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
          href={links.jupiter}
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
}; 