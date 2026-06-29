import { createContext, useContext, useState } from 'react';

export interface BandThreshold {
  min: number;
  max: number;
}

export interface Thresholds {
  food: BandThreshold;
  labor: BandThreshold;
}

const DEFAULT_THRESHOLDS: Thresholds = {
  food:  { min: 30, max: 33 },
  labor: { min: 14, max: 17 },
};

interface SettingsContextValue {
  thresholds: Thresholds;
  setThresholds: (t: Thresholds) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  return (
    <SettingsContext.Provider value={{ thresholds, setThresholds }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
