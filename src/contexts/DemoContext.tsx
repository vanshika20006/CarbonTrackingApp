import React, { createContext, useContext, useState, useCallback } from 'react';
import { generateMockWeekData, BADGES } from '@/lib/carbonCalculations';

interface DemoEntry {
  id: string;
  date: Date;
  travel: number;
  electricity: number;
  food: number;
  total: number;
  travelMode: string;
  foodType: string;
}

interface DemoUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: DemoUser | null;
  demoEntries: DemoEntry[];
  demoBadges: string[];
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  addDemoEntry: (entry: Omit<DemoEntry, 'id'>) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [demoEntries, setDemoEntries] = useState<DemoEntry[]>([]);
  const [demoBadges, setDemoBadges] = useState<string[]>([]);

  const enableDemoMode = useCallback(() => {
    // Create demo user
    setDemoUser({
      id: 'demo-user',
      name: 'Eco Explorer',
      email: 'demo@carbonsense.app',
    });

    // Generate mock week data
    const mockData = generateMockWeekData();
    const entries = mockData.map((entry, index) => ({
      ...entry,
      id: `demo-entry-${index}`,
    }));
    setDemoEntries(entries);

    // Award some badges
    setDemoBadges(['eco_starter', 'bike_lover', 'veg_day']);

    setIsDemoMode(true);
  }, []);

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setDemoUser(null);
    setDemoEntries([]);
    setDemoBadges([]);
  }, []);

  const addDemoEntry = useCallback((entry: Omit<DemoEntry, 'id'>) => {
    setDemoEntries(prev => [...prev, { ...entry, id: `demo-entry-${Date.now()}` }]);
  }, []);

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoUser,
      demoEntries,
      demoBadges,
      enableDemoMode,
      disableDemoMode,
      addDemoEntry,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
