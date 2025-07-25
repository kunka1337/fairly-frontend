"use client";

import React, { createContext, useContext, useRef, useCallback, useEffect, useState, ReactNode } from 'react';
import type { WebSocketData, WebSocketUpdate } from '@/types/token';
import { TokenDataService } from '@/services/token-service';
import { mapPoolToToken, CONSTANTS } from '@/lib/token-utils';

// Re-export types for backwards compatibility
export type { TokenWithPool, WebSocketData, WebSocketUpdate } from '@/types/token';

// Context types
type WebSocketSubscriber = (data: WebSocketData) => void;

interface WebSocketContextType {
  data: WebSocketData;
  subscribe: (callback: WebSocketSubscriber) => () => void;
  isConnected: boolean;
  isPaused: boolean;
  setPaused: (paused: boolean) => void;
}

const sortAndTruncateLists = (lists: WebSocketData): WebSocketData => {
  // Get the priority token ID from environment
  const priorityTokenId = process.env.NEXT_PUBLIC_CA;

  // New: listedTime (createdAt) desc
  const recent = [...lists.recent]
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      const aTime = new Date(a.item.pool.createdAt || a.item.createdAt || 0).getTime();
      const bTime = new Date(b.item.pool.createdAt || b.item.createdAt || 0).getTime();
      return bTime - aTime || a.idx - b.idx;
    })
    .map(({ item }) => item)
    .slice(0, CONSTANTS.MAX_LIST_SIZE);

  // Soon: bondingCurve desc
  const aboutToGraduate = [...lists.aboutToGraduate]
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      const aCurve = a.item.pool.bondingCurve ?? 0;
      const bCurve = b.item.pool.bondingCurve ?? 0;
      return bCurve - aCurve || a.idx - b.idx;
    })
    .map(({ item }) => item)
    .slice(0, CONSTANTS.MAX_LIST_SIZE);

  // Bonded: graduatedAt desc with priority token at top
  const graduated = [...lists.graduated]
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      // Check if either item is the priority token
      const aIsPriority = priorityTokenId && (
        a.item.pool.baseAsset?.id === priorityTokenId || 
        a.item.id === priorityTokenId
      );
      const bIsPriority = priorityTokenId && (
        b.item.pool.baseAsset?.id === priorityTokenId || 
        b.item.id === priorityTokenId
      );

      // Priority token should always come first
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      
      // If both are priority or both are not priority, sort by graduatedAt desc
      const aTime = new Date(a.item.pool.baseAsset?.graduatedAt || a.item.pool.graduatedAt || 0).getTime();
      const bTime = new Date(b.item.pool.baseAsset?.graduatedAt || b.item.pool.graduatedAt || 0).getTime();
      return bTime - aTime || a.idx - b.idx;
    })
    .map(({ item }) => item)
    .slice(0, CONSTANTS.MAX_LIST_SIZE);

  return { recent, aboutToGraduate, graduated };
};

// Context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Provider Component
export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<WebSocketData>({
    recent: [],
    aboutToGraduate: [],
    graduated: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Set<WebSocketSubscriber>>(new Set());
  const currentDataRef = useRef<WebSocketData>({
    recent: [],
    aboutToGraduate: [],
    graduated: [],
  });

  // Subscribe to updates
  const subscribe = useCallback((callback: WebSocketSubscriber) => {
    subscribersRef.current.add(callback);
    // Immediately call with current data
    callback(currentDataRef.current);
    
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // Notify all subscribers
  const notifySubscribers = useCallback((newData: WebSocketData) => {
    subscribersRef.current.forEach(callback => callback(newData));
  }, []);

  // Handle WebSocket updates
  const handleWebSocketUpdates = useCallback((updates: WebSocketUpdate[]) => {
    let { recent, aboutToGraduate, graduated } = currentDataRef.current;
    
    // Create defensive copies
    recent = [...recent];
    aboutToGraduate = [...aboutToGraduate];
    graduated = [...graduated];

    for (const update of updates) {
      const pool = update.pool;
      const id = pool.id;

      if (update.type === "new") {
        // Add or update in recent/aboutToGraduate
        const tokenObj = { pool, ...mapPoolToToken(pool, 'new') };
        const idx = recent.findIndex(t => t.pool.id === id);
        if (idx === -1) recent.push(tokenObj);
        else recent[idx] = tokenObj;
      } else if (update.type === "update") {
        // Update in all lists where present
        [recent, aboutToGraduate, graduated].forEach(list => {
          const idx = list.findIndex(t => t.pool.id === id);
          if (idx !== -1) {
            const category = list === graduated ? 'bonded' : list[idx]?.category || 'new';
            list[idx] = { pool, ...mapPoolToToken(pool, category) };
          }
        });
      } else if (update.type === "graduated") {
        // Move to graduated, remove from others
        const tokenObj = { pool, ...mapPoolToToken(pool, 'bonded') };
        recent = recent.filter(t => t.pool.id !== id);
        aboutToGraduate = aboutToGraduate.filter(t => t.pool.id !== id);
        const idx = graduated.findIndex(t => t.pool.id === id);
        if (idx === -1) graduated.push(tokenObj);
        else graduated[idx] = tokenObj;
      }
    }

    // Re-sort and truncate
    const sorted = sortAndTruncateLists({ recent, aboutToGraduate, graduated });
    currentDataRef.current = sorted;
    
    if (!isPaused) {
      setData(sorted);
      notifySubscribers(sorted);
    }
  }, [isPaused, notifySubscribers]);

  // Set paused state
  const setPaused = useCallback((paused: boolean) => {
    setIsPaused(paused);
    if (!paused) {
      // Unpausing: sync UI to latest data
      setData({ ...currentDataRef.current });
      notifySubscribers(currentDataRef.current);
    }
  }, [notifySubscribers]);

  // Initial data fetch
  useEffect(() => {
    TokenDataService.fetchInitialPoolsData()
      .then((responseData) => {
        // Map to Token objects
        const recent = responseData.recent.map((p: any) => ({ pool: p, ...mapPoolToToken(p, 'new') }));
        const aboutToGraduate = responseData.aboutToGraduate.map((p: any) => ({ pool: p, ...mapPoolToToken(p, 'soon') }));
        const graduated = responseData.graduated.map((p: any) => ({ pool: p, ...mapPoolToToken(p, 'bonded') }));
        
        const sorted = sortAndTruncateLists({ recent, aboutToGraduate, graduated });
        currentDataRef.current = sorted;
        setData(sorted);
        notifySubscribers(sorted);
      })
      .catch(err => console.error('Failed to fetch initial data:', err));
  }, [notifySubscribers]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(CONSTANTS.WS_ENDPOINTS.TRENCH_STREAM);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: "subscribe:recent",
        filters: { partnerConfigs: CONSTANTS.PARTNER_CONFIGS },
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.data) return;
        handleWebSocketUpdates(msg.data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [handleWebSocketUpdates]);

  const contextValue: WebSocketContextType = {
    data,
    subscribe,
    isConnected,
    isPaused,
    setPaused,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Hook for specific data subscriptions
export const useWebSocketData = () => {
  const { data, subscribe } = useWebSocket();
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    return subscribe(setLocalData);
  }, [subscribe]);

  return localData;
}; 