"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FarcasterUser {
  fid: number;
  token?: string;
}

interface FarcasterContextType {
  isInFarcaster: boolean;
  isReady: boolean;
  user: FarcasterUser | null;
  login: () => Promise<void>;
  logout: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

interface FarcasterProviderProps {
  children: ReactNode;
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<FarcasterUser | null>(null);

  const handleLogin = useCallback(async () => {
    if (!isInFarcaster) {
      console.warn('Login is only available within Farcaster Mini App');
      return;
    }

    try {
      const { token } = await sdk.quickAuth.getToken();

      if (!token) {
        throw new Error('No token received from Farcaster');
      }

      // Decode the JWT payload to get user info
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3 || !tokenParts[1]) {
        throw new Error('Invalid JWT token format');
      }

      const payload = JSON.parse(atob(tokenParts[1]));

      setUser({
        fid: payload.sub,
        token
      });
    } catch (error) {
      console.error('Failed to authenticate with Farcaster:', error);
    }
  }, [isInFarcaster]);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Check if we're running in a Farcaster Mini App environment
        const isFarcasterEnv = await sdk.isInMiniApp();

        setIsInFarcaster(isFarcasterEnv);

        if (isFarcasterEnv) {
          // Initialize the SDK and mark the app as ready
          await sdk.actions.ready();
          await sdk.actions.addMiniApp()

          // Try to get existing token if available
          const existingToken = sdk.quickAuth.token;
          if (existingToken) {
            // You would decode the JWT here to get the FID
            // For now, we'll trigger a login to get fresh user data
            await handleLogin();
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        setIsReady(true); // Still mark as ready even if initialization fails
      }
    };

    initializeFarcaster();
  }, [handleLogin]);

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (isInFarcaster && user?.token) {
      return sdk.quickAuth.fetch(url, options);
    } else {
      // Fallback to regular fetch for non-Farcaster environments
      return fetch(url, options);
    }
  };

  const contextValue: FarcasterContextType = {
    isInFarcaster,
    isReady,
    user,
    login: handleLogin,
    logout: handleLogout,
    authenticatedFetch
  };

  return (
    <FarcasterContext.Provider value={contextValue}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
} 