import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SolanaProvider } from "@/components/SolanaProvider";
import { ThemeProvider } from "next-themes";
import { WebSocketProvider } from "@/lib/websocket-context";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { FarcasterProvider } from "@/contexts/FarcasterContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fairly",
  description: "Fairly is a dev-first Solana memecoin launchpad returning 95 percents of all fees to creators.",
  other: {
    // Backward compatibility
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://fairly.best/preview.png",
      button: {
        title: "Launch",
        action: {
          type: "launch_frame",
          name: "Fairly",
          url: "https://fairly.best",
          splashImageUrl: "https://fairly.best/splash.png",
          iconUrl: "https://fairly.best/icon.png",
          splashBackgroundColor: "#070B08",
          description: "Fairly is a dev-first Solana memecoin launchpad returning 95 percents of all fees to creators.",
          primaryCategory: "finance",
        }
      }
    })
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <FarcasterProvider>
            <SolanaProvider>
              <WebSocketProvider>
                <NavigationProvider>
                  {children}
                  <Toaster position="top-right" />
                </NavigationProvider>
              </WebSocketProvider>
            </SolanaProvider>
          </FarcasterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
