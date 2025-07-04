import React, { useState } from "react";
import Image from "next/image";
import { Copy, Check, Globe, Search } from "lucide-react";
import { XLogo, TelegramLogo, DexscreenerLogo } from '../logos';
import { toast } from "sonner";
import type { JupiterPool, SocialLinks } from '@/types/token';
import { getTokenLinks } from '@/lib/token-utils';

interface TokenHeaderProps {
  poolData: JupiterPool;
  socialLinks: SocialLinks;
  timeAgo: string;
  isTokenBonded: boolean;
  onCopy: (text: string) => void;
}

export const TokenHeader: React.FC<TokenHeaderProps> = ({
  poolData,
  socialLinks,
  timeAgo,
  isTokenBonded,
  onCopy
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(poolData.baseAsset.id);
      setCopied(true);
      toast("Token ID copied!");
      setTimeout(() => setCopied(false), 2000);
      onCopy(poolData.baseAsset.id);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error("Failed to copy");
    }
  };

  const links = getTokenLinks(poolData.baseAsset.id, poolData.id, isTokenBonded);

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
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {poolData.baseAsset.symbol}
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground truncate">
              {poolData.baseAsset.name}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Copy token ID"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground pr-1">
              {timeAgo} ago
            </div>
            <div className="flex items-center gap-3">
              <a
                href={links.xSearch}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search on X"
              >
                <Search className="w-3.5 h-3.5" />
              </a>
              <a
                href={links.dexscreener}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="View on DexScreener"
              >
                <DexscreenerLogo className="w-3.5 h-3.5" />
              </a>
              {socialLinks.website && (
                <a
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Visit website"
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
                  aria-label="View on X"
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
                  aria-label="Join Telegram"
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
}; 