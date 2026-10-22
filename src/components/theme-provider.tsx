"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useServerInsertedHTML } from "next/navigation";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme | undefined;
  themes: Theme[];
  systemTheme: ResolvedTheme | undefined;
};

const STORAGE_KEY = "theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * FOUC-prevention script injected via useServerInsertedHTML so React 19 never
 * sees a client-rendered <script> (next-themes' approach triggers a console error).
 */
const THEME_INIT_SCRIPT = `(function(){try{var s='${STORAGE_KEY}';var t=localStorage.getItem(s)||'system';var r=t;if(t==='system'){r=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var d=document.documentElement;d.classList.remove('light','dark');d.classList.add(r);d.style.colorScheme=r}catch(e){}})();`;

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | undefined>(
    undefined,
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme | undefined>(
    undefined,
  );

  useServerInsertedHTML(() => (
    <script
      id="swahili-trail-theme-init"
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  ));

  useEffect(() => {
    let initial: Theme = "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        initial = stored;
      }
    } catch {
      /* ignore */
    }
    setThemeState(initial);
    setSystemTheme(getSystemTheme());
    setResolvedTheme(applyTheme(initial));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const nextSystem = getSystemTheme();
      setSystemTheme(nextSystem);
      setThemeState((current) => {
        if (current === "system") {
          setResolvedTheme(applyTheme("system"));
        }
        return current;
      });
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setResolvedTheme(applyTheme(next));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      themes: ["light", "dark", "system"],
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system" as Theme,
      setTheme: (_: Theme) => {},
      resolvedTheme: undefined as ResolvedTheme | undefined,
      themes: ["light", "dark", "system"] as Theme[],
      systemTheme: undefined as ResolvedTheme | undefined,
    };
  }
  return ctx;
}
