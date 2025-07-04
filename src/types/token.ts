// Common token-related types used across the application

export interface BaseAsset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  dev: string;
  circSupply: number;
  totalSupply: number;
  tokenProgram: string;
  launchpad: string;
  partnerConfig: string;
  firstPool: {
    id: string;
    createdAt: string;
  };
  graduatedAt?: string;
  holderCount: number;
  audit: {
    mintAuthorityDisabled: boolean;
    freezeAuthorityDisabled: boolean;
  };
  organicScore: number;
  organicScoreLabel: string;
  tags: string[];
  fdv: number;
  mcap: number;
  usdPrice: number;
  priceBlockId: number;
  liquidity: number;
  twitter?: string;
  telegram?: string;
  website?: string;
  stats24h?: TokenStats24h;
}

export interface TokenStats24h {
  priceChange: number;
  holderChange: number;
  liquidityChange: number;
  buyVolume: number;
  sellVolume: number;
  buyOrganicVolume: number;
  sellOrganicVolume: number;
  numBuys: number;
  numSells: number;
  numTraders: number;
}

export interface JupiterPool {
  id: string;
  chain: string;
  dex: string;
  type: string;
  quoteAsset: string;
  createdAt: string;
  graduatedAt?: string;
  liquidity: number;
  bondingCurve: number;
  volume24h: number;
  updatedAt: string;
  baseAsset: BaseAsset;
}

export interface JupiterPoolResponse {
  pools: JupiterPool[];
  total: number;
}

export interface SocialLinks {
  twitter?: string;
  telegram?: string;
  website?: string;
}

export interface RewardsState {
  creator: number | null;
  amm: number | null;
  loading: {
    creator: boolean;
    amm: boolean;
  };
  claiming: boolean;
  claimed: boolean;
}

export interface TokenModalProps {
  tokenId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface TokenWithPool {
  id: string;
  name: string;
  symbol: string;
  marketCap: number;
  volume: number;
  progress: number;
  category: 'new' | 'soon' | 'bonded';
  image: string;
  createdAt?: string;
  pool: JupiterPool;
}

export interface WebSocketData {
  recent: TokenWithPool[];
  aboutToGraduate: TokenWithPool[];
  graduated: TokenWithPool[];
}

export interface WebSocketUpdate {
  type: 'new' | 'update' | 'graduated';
  pool: JupiterPool;
} 