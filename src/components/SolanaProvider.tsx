"use client";
import React, { FC, ReactNode, useMemo } from "react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter,
  CoinbaseWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { FarcasterSolanaProvider } from '@farcaster/mini-app-solana';

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  return (
    <FarcasterSolanaProvider endpoint={process.env.NEXT_PUBLIC_RPC_URL!}>
      {children}
    </FarcasterSolanaProvider>
  );
};

export default SolanaProvider; 