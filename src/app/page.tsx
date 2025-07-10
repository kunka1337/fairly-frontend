"use client";

import React, { Suspense } from "react";
import Header from "@/components/Header";
import TradePageContent from "@/app/page-content";
import MobileApp from "@/components/MobileApp";
import { useNavigation } from "@/contexts/NavigationContext";
import { Spinner } from '@/components/ui/spinner';

const Page = () => {
  const { isMobileNavigation } = useNavigation();

  // Show mobile app for small screens
  if (isMobileNavigation) {
    return <MobileApp />;
  }

  // Show desktop version for larger screens
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-grow overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        }>
          <TradePageContent />
        </Suspense>
      </main>
    </div>
  );
};

export default Page;
