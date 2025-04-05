import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider storageKey="bitlook-theme" {...props}>
      {children}
    </NextThemesProvider>
  );
}

// Re-export useTheme from next-themes
export { useTheme } from "next-themes";
