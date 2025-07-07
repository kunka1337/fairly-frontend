import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Rocket, HelpCircle, ChevronDown, Coins, Sun, Moon, LogOut, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { XLogo, TelegramLogo, FarcasterLogo } from './logos';
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import WalletSelectModal from "@/components/WalletSelectModal";
import { useTheme } from "next-themes";

// Common components
const Logo = ({ theme, mounted }: { theme: string | undefined; mounted: boolean }) => {
  const logoSrc = mounted ? (theme === "dark" ? "/logo_dark.png" : "/logo_light.png") : "/logo_dark.png";
  return (
    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center">
        <Image
          src={logoSrc}
          alt="Fairly Logo"
          width={40}
          height={40}
          className="w-10 h-10"
          priority
        />
      </div>
      <h1 className="text-2xl font-bold text-foreground hidden sm:block">Fairly</h1>
    </Link>
  );
};

const CreateTokenButton = () => (
  <div className="hidden sm:flex items-center gap-2">
    <Link href="/create-token">
      <Button variant="outline" className="flex items-center gap-2 px-3 py-2 rounded-md">
        <Rocket className="w-4 h-4" />
        <span className="hidden sm:inline">Create token</span>
      </Button>
    </Link>
  </div>
);

const SocialLinks = () => (
  <div className="mt-8 space-y-4">
    <h3 className="text-sm font-medium text-left">Connect with us</h3>
    <div className="space-y-3">
      <a
        href="https://farcaster.xyz/fairlydotbest"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <FarcasterLogo className="w-4 h-4 text-[#8A63D2]" />
        <span className="text-sm">Follow us on Farcaster</span>
      </a>
      <a
        href="https://x.com/fairlydotbest"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <XLogo className="w-4 h-4" />
        <span className="text-sm">Follow us on X</span>
      </a>
      <a
        href="https://t.me/fairlydotbest"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <TelegramLogo className="w-4 h-4" />
        <span className="text-sm">Join our Telegram</span>
      </a>
    </div>
  </div>
);

const HelpSheet = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" size="icon">
        <HelpCircle className="w-4 h-4" />
      </Button>
    </SheetTrigger>
    <SheetContent className="[&>button]:hidden overflow-y-auto">
      <div className="space-y-6 pb-6">
        <SheetHeader className="text-left space-y-6">
          <div>
            <SheetTitle className="text-left">How do I launch with Fairly?</SheetTitle>
            <SheetDescription className="text-left mt-2">
              Connect your Solana wallet on Fairly, press "Create token", enter your token's name, ticker, image, and social links, then hit Launch.
            </SheetDescription>
          </div>

          <div>
            <SheetTitle className="text-left">How do I claim my fees?</SheetTitle>
            <SheetDescription className="text-left mt-2">
              Head to the My Tokens tab, select the token you want to collect fees from (both bonding curve or AMM), and click "Claim" to receive your accrued SOL.
            </SheetDescription>
          </div>

          <div>
            <SheetTitle className="text-left">Where can I buy Fairly memecoins?</SheetTitle>
            <SheetDescription className="text-left mt-2">
              You can buy Fairly tokens instantly on Axiom, BullX, Photon, Jupiter, and all other major Solana trading platforms.
            </SheetDescription>
          </div>

          <div>
            <SheetTitle className="text-left">Where can I find my launched memecoins?</SheetTitle>
            <SheetDescription className="text-left mt-2">
              Once you connect your wallet, your tokens will show up in the My Tokens section of your Fairly profile.
            </SheetDescription>
          </div>

          <div>
            <SheetTitle className="text-left">What percentage of fees goes back to creators vs. the platform?</SheetTitle>
            <SheetDescription className="text-left mt-2">
              Creators receive 95% of fees from both the bonding curve and AMM. The remaining 5% supports the Fairly platform. Fees start at 10% and ramp down to 2% over the first 300 seconds to protect launches from snipers—and all fees are paid solely in SOL.
            </SheetDescription>
          </div>
        </SheetHeader>
        <SocialLinks />
      </div>
    </SheetContent>
  </Sheet>
);

const Header = () => {
  const { publicKey, disconnect, connecting, wallet } = useWallet();
  console.log("111------", publicKey, disconnect, connecting, wallet)
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!publicKey || !connection) return;
    let subscriptionId: number | null = null;

    connection.getAccountInfo(publicKey).then((info) => {
      setBalance(info ? info.lamports / LAMPORTS_PER_SOL : 0);
    });

    subscriptionId = connection.onAccountChange(
      publicKey,
      (info) => setBalance(info.lamports / LAMPORTS_PER_SOL),
      "confirmed"
    );

    return () => {
      if (subscriptionId !== null) {
        connection.removeAccountChangeListener(subscriptionId);
      }
    };
  }, [publicKey, connection]);

  const shortKey = publicKey ? publicKey.toBase58().slice(0, 4) : "";
  const solBalance = balance !== null ? `${balance.toFixed(2)} SOL` : "-";

  const handleDisconnect = async () => {
    await disconnect();
  };

  const renderWalletContent = () => {
    if (!publicKey) {
      return (
        <Button onClick={() => setWalletModalOpen(true)} disabled={connecting}>
          {connecting ? "Connecting..." : (
            <>
              <span className="sm:hidden">Connect</span>
              <span className="hidden sm:inline">Connect wallet</span>
            </>
          )}
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <span className="flex items-center gap-x-2">
              <div className="w-6 h-6 bg-muted/30 border border-white rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="sm:hidden">{shortKey} · {solBalance}</span>
              <span className="hidden sm:inline">{shortKey} · {solBalance}</span>
              <ChevronDown className="w-4 h-4" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/my-tokens" className="flex items-center">
              <Coins className="mr-2 h-4 w-4" />
              <span>My Tokens</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="text-red-500 focus:text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect wallet</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      {!publicKey && <WalletSelectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo theme={theme} mounted={mounted} />
          </div>
          <div className="flex items-center gap-3">
            <HelpSheet />
            <CreateTokenButton />
            {renderWalletContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header; 