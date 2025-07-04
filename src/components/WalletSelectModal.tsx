"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";

export default function WalletSelectModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { wallets, select, connect, connecting, wallet } = useWallet();
  const [selected, setSelected] = useState<string | null>(null);
  const [shouldConnect, setShouldConnect] = useState(false);

  // Find the first detected (installed) wallet
  const detectedWallet = wallets.find(w => w.readyState === "Installed");

  // Preselect detected wallet or first wallet when modal opens
  useEffect(() => {
    if (open) {
      if (detectedWallet) {
        setSelected(detectedWallet.adapter.name);
      } else if (wallets.length > 0 && wallets[0]) {
        setSelected(wallets[0].adapter.name);
      } else {
        setSelected(null);
      }
    }
  }, [open, detectedWallet, wallets]);

  // Effect to connect after wallet selection
  useEffect(() => {
    if (shouldConnect && wallet && wallet.adapter.name === selected) {
      connect().then(() => {
        onOpenChange(false);
        setShouldConnect(false);
      });
    }
  }, [shouldConnect, wallet, selected, connect, onOpenChange]);

  const handleConnect = () => {
    if (selected) {
      if (wallet && wallet.adapter.name === selected) {
        connect().then(() => {
          onOpenChange(false);
        });
      } else {
        select(selected as WalletName);
        setShouldConnect(true);
      }
    }
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
          onValueChange={setSelected}
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
          <Button onClick={handleConnect} disabled={!selected && !detectedWallet}>
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 