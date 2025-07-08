"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";

export default function WalletSelectModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { wallets, select, connect, connecting, wallet, connected } = useWallet();
  const [selected, setSelected] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Find the first detected (installed) wallet
  const detectedWallet = wallets.find(w => w.readyState === "Installed");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      if (detectedWallet) {
        setSelected(detectedWallet.adapter.name);
      } else if (wallets.length > 0 && wallets[0]) {
        setSelected(wallets[0].adapter.name);
      } else {
        setSelected(null);
      }
      setIsConnecting(false);
    } else {
      // Reset state when modal closes
      setSelected(null);
      setIsConnecting(false);
    }
  }, [open, detectedWallet, wallets]);

  // Close modal when successfully connected
  useEffect(() => {
    if (connected && open) {
      onOpenChange(false);
    }
  }, [connected, open, onOpenChange]);

  const handleConnect = useCallback(async () => {
    if (!selected) return;

    try {
      setIsConnecting(true);
      
      if (wallet && wallet.adapter.name === selected) {
        // Wallet is already selected, just connect
        await connect();
      } else {
        // Select wallet first, then connect
        select(selected as WalletName);
        // The wallet selection will trigger a re-render, and we'll connect in the next effect
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsConnecting(false);
    }
  }, [selected, wallet, connect, select]);

  // Connect after wallet selection
  useEffect(() => {
    if (wallet && wallet.adapter.name === selected && isConnecting) {
      connect()
        .then(() => {
          setIsConnecting(false);
        })
        .catch((error) => {
          console.error('Failed to connect wallet:', error);
          setIsConnecting(false);
        });
    }
  }, [wallet, selected, connect, isConnecting]);

  const handleWalletSelect = (walletName: string) => {
    setSelected(walletName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>Select a wallet to connect</DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={selected ?? detectedWallet?.adapter.name ?? undefined}
          onValueChange={handleWalletSelect}
          className="flex flex-col gap-2"
        >
          {wallets.map(wallet => (
            <label
              key={wallet.adapter.name}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-colors ${
                (selected === wallet.adapter.name || (!selected && detectedWallet?.adapter.name === wallet.adapter.name))
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Image 
                src={wallet.adapter.icon} 
                alt={wallet.adapter.name} 
                width={24}
                height={24}
                className="w-6 h-6" 
                unoptimized={true}
              />
              <span className="flex-1">{wallet.adapter.name}</span>
              {detectedWallet?.adapter.name === wallet.adapter.name && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground">Detected</span>
              )}
              <RadioGroupItem
                value={wallet.adapter.name}
                checked={selected === wallet.adapter.name || (!selected && detectedWallet?.adapter.name === wallet.adapter.name)}
                className="ml-auto"
              />
            </label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleConnect} 
            disabled={!selected || connecting || isConnecting}
          >
            {connecting || isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 