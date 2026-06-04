"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { statsStore } from "@/lib/storage/stats-store";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";

interface SettingsContextValue {
  settings: Settings;
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyTheme(theme: Settings["theme"]) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "auto" && prefersDark);
  root.classList.toggle("dark", dark);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted settings once on mount.
  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const loaded = await statsStore.getSettings();
        if (cancelled) return;
        setSettings(loaded);
        applyTheme(loaded.theme);
      } catch (err) {
        console.error("Failed to load settings:", err);
        applyTheme(DEFAULT_SETTINGS.theme);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-evaluate auto theme when the OS preference changes.
  useEffect(() => {
    if (settings.theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void statsStore.saveSettings(next).catch((err) => {
        console.error("Failed to save settings:", err);
      });
      if (patch.theme) applyTheme(next.theme);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, hydrated, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
