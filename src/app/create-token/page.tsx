"use client";

import React from "react";
import Header from "@/components/Header";
import CreateTokenPageContent from "@/app/create-token/page-content";
import MobileApp from "@/components/MobileApp";
import { useNavigation } from "@/contexts/NavigationContext";

const CreateTokenPage = () => {
  const { isMobileNavigation } = useNavigation();

  // Show mobile app for small screens (it will handle the create tab)
  if (isMobileNavigation) {
    return <MobileApp />;
  }

  // Show desktop version for larger screens
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <CreateTokenPageContent />
    </div>
  );
};

export default CreateTokenPage; 