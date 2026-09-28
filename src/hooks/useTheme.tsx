import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
export type Theme = "light" | "dark" | "system";
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("diary-theme");
    return stored === "light" || stored === "dark" ? stored : "system";
  });
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    if (theme !== "system") document.documentElement.classList.add(theme);
    localStorage.setItem("diary-theme", theme);
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw Error("Theme provider is missing");
  return context;
}
