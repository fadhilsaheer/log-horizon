import React, { createContext, useContext, useEffect, useState } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";

export type Theme = "light" | "dark" | "system";

const store = new LazyStore("settings.json");

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load the initial theme from the store
    const init = async () => {
      try {
        const savedTheme = await store.get<Theme>("theme");
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      } catch (e) {
        console.error("Failed to load theme from store", e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Save to store whenever theme changes
    store.set("theme", theme)
      .then(() => store.save())
      .catch(e => console.error("Failed to save theme", e));

    // Apply the theme to the document
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme !== "system") {
      root.classList.add(theme);
    }
  }, [theme, isLoaded]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
