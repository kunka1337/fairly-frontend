"use client";

import { useState, useEffect, useRef } from 'react';

// Calculate time ago instantly without intervals for better performance
const calculateTimeAgo = (isoDate: string): string => {
  const launchDate = new Date(isoDate);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - launchDate.getTime()) / 1000);

  if (seconds < 0) {
    return 'soon';
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export const useTimeAgo = (isoDate?: string) => {
  const [timeAgo, setTimeAgo] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isoDate) {
      setTimeAgo('-');
      return;
    }

    // Calculate initial value instantly
    const initialValue = calculateTimeAgo(isoDate);
    setTimeAgo(initialValue);

    // Only use interval for very recent tokens (under 2 minutes)
    // For older tokens, the time doesn't need real-time updates
    const launchDate = new Date(isoDate);
    const now = new Date();
    const ageInMinutes = Math.floor((now.getTime() - launchDate.getTime()) / (1000 * 60));

    if (ageInMinutes < 2) {
      // Only update every second for very recent tokens
      intervalRef.current = setInterval(() => {
        const newValue = calculateTimeAgo(isoDate);
        setTimeAgo(newValue);
        
        // Stop the interval once the token is over 2 minutes old
        const currentAge = Math.floor((new Date().getTime() - launchDate.getTime()) / (1000 * 60));
        if (currentAge >= 2) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isoDate]);

  return timeAgo;
}; 