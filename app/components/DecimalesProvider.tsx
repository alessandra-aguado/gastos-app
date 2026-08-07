"use client";

import { createContext, useContext } from "react";

const DecimalesContext = createContext(0);

export function useDecimales() {
  return useContext(DecimalesContext);
}

export default function DecimalesProvider({ decimales, children }: { decimales: number; children: React.ReactNode }) {
  return <DecimalesContext.Provider value={decimales}>{children}</DecimalesContext.Provider>;
}
