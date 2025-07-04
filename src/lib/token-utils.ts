import type { TokenWithPool, JupiterPool } from '@/types/token';

/**
 * Formats numbers in a human-readable way with appropriate suffixes
 */
export const prettifyNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 100_000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  if (num >= 10_000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  if (num >= 100) {
    return `$${num.toFixed(0)}`;
  }
  if (num >= 10) {
    return `$${num.toFixed(1)}`;
  }
  return `$${num.toFixed(2)}`;
};

/**
 * Formats a wallet address to show first and last characters
 */
export const formatAddress = (address: string, chars: number = 4): string => {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Calculates total transactions from stats
 */
export const getTotalTransactions = (pool: JupiterPool): number => {
  return (pool.baseAsset.stats24h?.numBuys || 0) + (pool.baseAsset.stats24h?.numSells || 0);
};

/**
 * Determines if a token is bonded/graduated based on various criteria
 */
export const isTokenBonded = (
  poolData: JupiterPool | null,
  wsData: any,
  tokenId: string
): boolean => {
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
};

/**
 * Maps pool data to token object for different categories
 */
export const mapPoolToToken = (
  pool: any, 
  category: 'new' | 'soon' | 'bonded'
): Omit<TokenWithPool, 'pool'> => ({
  id: pool.id,
  name: pool.baseAsset?.name || 'Unknown',
  symbol: pool.baseAsset?.symbol || '???',
  marketCap: pool.baseAsset?.mcap ?? 0,
  volume: pool.volume24h ?? 0,
  progress: category === 'bonded' ? 100 : (pool.bondingCurve ?? 0),
  category,
  image: pool.baseAsset?.icon || null,
  createdAt: pool.baseAsset?.firstPool?.createdAt || pool.baseAsset?.createdAt || pool.createdAt,
});

/**
 * Copy text to clipboard with toast feedback
 */
export const copyToClipboard = async (text: string, _successMessage: string = 'Copied!'): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    // Note: toast import should be done in the component that uses this function
    // to avoid dependency issues
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return Promise.reject(error);
  }
};

/**
 * Validates URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generates external links for tokens
 */
export const getTokenLinks = (tokenId: string, poolId?: string, isTokenBonded?: boolean) => ({
  dexscreener: `https://dexscreener.com/solana/${isTokenBonded ? poolId : tokenId}`,
  jupiter: `https://jup.ag/swap/So11111111111111111111111111111111111111112-${tokenId}`,
  axiom: `https://axiom.trade/t/${tokenId}/@fairly`,
  solscan: `https://solscan.io/token/${tokenId}`,
  xSearch: `https://x.com/search?q=${tokenId}`,
});

/**
 * Get pool config key from environment variables
 */
const getPoolConfigKey = (): string => {
  const poolConfigKey = process.env.NEXT_PUBLIC_POOL_CONFIG_KEY;
  
  if (!poolConfigKey) {
    throw new Error('NEXT_PUBLIC_POOL_CONFIG_KEY environment variable is required');
  }
  
  return poolConfigKey;
};

/**
 * Constants used across the application
 */
export const CONSTANTS = {
  MAX_LIST_SIZE: 30,
  PARTNER_CONFIGS: [getPoolConfigKey()],
  API_ENDPOINTS: {
    JUPITER_POOLS: "https://datapi.jup.ag/v1/pools/gems",
    JUPITER_POOL_DATA: "https://datapi.jup.ag/v1/pools",
  },
  WS_ENDPOINTS: {
    TRENCH_STREAM: "wss://trench-stream.jup.ag/ws",
  },
} as const; 