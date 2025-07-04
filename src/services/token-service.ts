import { Connection, PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { CpAmm, getUnClaimReward } from "@meteora-ag/cp-amm-sdk";
import type { JupiterPool, JupiterPoolResponse } from '@/types/token';
import { CONSTANTS } from '@/lib/token-utils';

/**
 * Service class for token-related API operations
 * Centralizes data fetching and business logic
 */
export class TokenDataService {
  /**
   * Fetches pool data from Jupiter API
   */
  static async fetchPoolData(tokenId: string): Promise<JupiterPool | null> {
    try {
      const response = await fetch(
        `${CONSTANTS.API_ENDPOINTS.JUPITER_POOL_DATA}?assetIds=${tokenId}`,
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
      return data.pools.length > 0 ? (data.pools[0] ?? null) : null;
    } catch (error) {
      console.error('Failed to fetch pool data:', error);
      return null;
    }
  }

  /**
   * Fetches creator rewards for Dynamic Bonding Curve tokens
   */
  static async fetchCreatorRewards(poolId: string, tokenId?: string): Promise<number> {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
      if (!rpcUrl) {
        console.error('NEXT_PUBLIC_RPC_URL environment variable not set');
        return 0;
      }
      
      const connection = new Connection(rpcUrl);
      const client = DynamicBondingCurveClient.create(connection);
      
      try {
        const feeMetrics = await client.state.getPoolFeeMetrics(poolId);
        const creatorQuoteFeeInSol = feeMetrics.current.creatorQuoteFee.toNumber() / 1e9;
        return creatorQuoteFeeInSol;
      } catch (poolError: any) {
        if (tokenId && poolError.message?.includes('account discriminator')) {
          console.warn('Pool ID not valid for Meteora, trying to find pool by token ID:', tokenId);
          
          try {
            const poolByMint = await client.state.getPoolByBaseMint(tokenId);
            if (poolByMint) {
              const feeMetrics = await client.state.getPoolFeeMetrics(poolByMint.publicKey.toString());
              const creatorQuoteFeeInSol = feeMetrics.current.creatorQuoteFee.toNumber() / 1e9;
              return creatorQuoteFeeInSol;
            }
          } catch (mintError) {
            console.warn('Could not find Meteora pool by token mint:', mintError);
          }
        }
        
        if (poolError.message?.includes('account discriminator')) {
          console.info('This token is not using Meteora dynamic bonding curve protocol');
          return 0;
        }
        
        throw poolError;
      }
    } catch (error) {
      console.error('Failed to fetch creator rewards:', error);
      return 0;
    }
  }

  /**
   * Fetches AMM creator rewards for bonded tokens
   */
  static async fetchAmmCreatorRewards(poolId: string, creatorAddress: string): Promise<number> {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
      if (!rpcUrl) {
        console.error('NEXT_PUBLIC_RPC_URL environment variable not set');
        return 0;
      }
      
      const connection = new Connection(rpcUrl);
      const cpAmm = new CpAmm(connection);
      
      try {
        const poolPublicKey = new PublicKey(poolId);
        const creatorPublicKey = new PublicKey(creatorAddress);
        
        const positions = await cpAmm.getUserPositionByPool(poolPublicKey, creatorPublicKey);
        
        if (!positions || positions.length === 0) {
          console.info('No AMM positions found for creator in this pool');
          return 0;
        }
        
        const poolState = await cpAmm.fetchPoolState(poolPublicKey);
        
        if (!poolState) {
          console.warn('Could not fetch AMM pool state');
          return 0;
        }
        
        let totalSolRewards = 0;
        
        for (const position of positions) {
          try {
            const positionState = await cpAmm.fetchPositionState(position.position);
            
            if (!positionState) {
              console.warn('Could not fetch position state for:', position.position.toString());
              continue;
            }
            
            const unclaimedRewards = getUnClaimReward(poolState, positionState);
            
            if (unclaimedRewards.feeTokenB) {
              const feeTokenBInSol = unclaimedRewards.feeTokenB.toNumber() / 1e9;
              totalSolRewards += feeTokenBInSol;
            }
            
            if (unclaimedRewards.feeTokenA) {
              const feeTokenAInSol = unclaimedRewards.feeTokenA.toNumber() / 1e9;
              if (feeTokenAInSol < totalSolRewards || totalSolRewards === 0) {
                totalSolRewards += feeTokenAInSol;
              }
            }
            
          } catch (positionError) {
            console.warn('Error processing position:', position.position.toString(), positionError);
          }
        }
        
        return totalSolRewards;
        
      } catch (ammError: any) {
        if (ammError.message?.includes('account discriminator') || ammError.message?.includes('Account does not exist')) {
          console.info('This pool is not an AMM pool or does not exist');
          return 0;
        }
        
        throw ammError;
      }
      
    } catch (error) {
      console.error('Failed to fetch AMM creator rewards:', error);
      return 0;
    }
  }

  /**
   * Fetches initial pools data for the main page
   */
  static async fetchInitialPoolsData(): Promise<{
    recent: any[];
    aboutToGraduate: any[];
    graduated: any[];
  }> {
    try {
      const requestBody = {
        recent: { timeframe: '24h', partnerConfigs: CONSTANTS.PARTNER_CONFIGS },
        graduated: { timeframe: '24h', partnerConfigs: CONSTANTS.PARTNER_CONFIGS },
        aboutToGraduate: { timeframe: '24h', partnerConfigs: CONSTANTS.PARTNER_CONFIGS }
      };

      const response = await fetch(CONSTANTS.API_ENDPOINTS.JUPITER_POOLS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        recent: data.recent?.pools || [],
        aboutToGraduate: data.aboutToGraduate?.pools || [],
        graduated: data.graduated?.pools || [],
      };
    } catch (error) {
      console.error('Failed to fetch initial pools data:', error);
      return {
        recent: [],
        aboutToGraduate: [],
        graduated: [],
      };
    }
  }

  /**
   * Helper method to validate environment variables
   */
  static validateEnvironment(): { isValid: boolean; missing: string[] } {
    const requiredVars = ['NEXT_PUBLIC_RPC_URL'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      isValid: missing.length === 0,
      missing,
    };
  }
}

/**
 * Error classes for better error handling
 */
export class TokenServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'TokenServiceError';
  }
}

export class NetworkError extends TokenServiceError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

export class ConfigurationError extends TokenServiceError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
} 