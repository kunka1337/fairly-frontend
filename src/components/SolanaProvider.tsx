"use client";
import React, { FC, ReactNode } from "react";
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