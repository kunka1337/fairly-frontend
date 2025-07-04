import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Rocket, HelpCircle, ChevronDown, Coins, Sun, Moon, LogOut, User, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { XLogo, TelegramLogo } from './logos';
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
import { useFarcaster } from "@/contexts/FarcasterContext";

const Header = () => {
  const { publicKey, disconnect, connecting } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isInFarcaster, isReady, user, login, logout } = useFarcaster();

  // Prevent hydration errors by waiting for client-side mount
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

  // Show fallback logo until mounted to prevent hydration errors
  const logoSrc = mounted ? (theme === "dark" ? "/logo_dark.png" : "/logo_light.png") : "/logo_dark.png";

  if (!publicKey) {
    return (
      <>
        <WalletSelectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            </div>
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>What is Fairly?</SheetTitle>
                    <SheetDescription>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                      do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/create-token">
                  <Button variant="outline" className="flex items-center gap-2 px-3 py-2 rounded-md">
                  <Rocket className="w-4 h-4" />
                    <span className="hidden sm:inline">Create token</span>
                  </Button>
                </Link>
              </div>
              {isInFarcaster && isReady ? (
                <>
                  {user ? (
                    <Button variant="outline" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="sm:hidden">FID {user.fid}</span>
                      <span className="hidden sm:inline">Farcaster FID {user.fid}</span>
                    </Button>
                  ) : (
                    <Button onClick={login} variant="outline" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="sm:hidden">Login FC</span>
                      <span className="hidden sm:inline">Login with Farcaster</span>
                    </Button>
                  )}
                </>
              ) : null}
              <Button onClick={() => setWalletModalOpen(true)} disabled={connecting}>
                {connecting ? "Connecting..." : (
                  <>
                    <span className="sm:hidden">Connect</span>
                    <span className="hidden sm:inline">Connect wallet</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handleDisconnect = async () => {
    await disconnect();
  };

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        </div>
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="[&>button]:hidden">
              <SheetHeader className="text-left space-y-4">
                <SheetTitle className="text-left">What is Fairly?</SheetTitle>
                <SheetDescription className="text-left">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna
                  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                  ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </SheetDescription>
              </SheetHeader>
              
              {/* Social Links */}
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-medium text-left">Connect with us</h3>
                <div className="space-y-3">
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XLogo className="w-4 h-4" />
                    <span className="text-sm">Follow us on X</span>
                  </a>
                  <a
                    href="https://telegram.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <TelegramLogo className="w-4 h-4" />
                    <span className="text-sm">Join our Telegram</span>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/create-token">
              <Button variant="outline" className="flex items-center gap-2 px-3 py-2 rounded-md">
              <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline">Create token</span>
              </Button>
            </Link>
          </div>
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
              {isInFarcaster && user && (
                <DropdownMenuItem onClick={logout} className="text-orange-500 focus:text-orange-500">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Logout Farcaster</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDisconnect} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Disconnect wallet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header; 