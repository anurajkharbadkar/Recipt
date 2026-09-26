'use client';

import React, { createContext, useContext } from 'react';
import type { Mandal } from '@/types/mandal';

const MandalContext = createContext<Mandal | null>(null);

export function MandalProvider({ mandal, children }: { mandal: Mandal; children: React.ReactNode }) {
  return (
    <MandalContext.Provider value={mandal}>
      {children}
    </MandalContext.Provider>
  );
}

export function useMandal(): Mandal {
  const mandal = useContext(MandalContext);
  if (!mandal) {
    throw new Error('useMandal must be used within a MandalProvider');
  }
  return mandal;
}

