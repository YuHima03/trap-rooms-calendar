'use client';

import React, { useLayoutEffect } from "react";
import { DeterminedThemeName, isThemeName, ThemeName } from "../config/themes";

const DefaultThemeName = "system";
const DefaultPreferredThemeName = "light";

const StoredThemeContext = React.createContext<{
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
} | null>(null);

/** The preferred theme is affected by both the stored theme and the system preference. */
const PreferredThemeContext = React.createContext<DeterminedThemeName>(DefaultPreferredThemeName);

const LocalStorageKeyForTheme = "theme";

function getStoredThemeOrDefault(): ThemeName {
  if (typeof window === "undefined") {
    return DefaultThemeName;
  }
  const storedTheme = localStorage.getItem(LocalStorageKeyForTheme);
  if (storedTheme && isThemeName(storedTheme)) {
    return storedTheme;
  }
  return DefaultThemeName;
}

/**
 * Returns the preferred theme based on the provided theme and system preference.
 */
export function getPreferredTheme(theme: ThemeName | null): DeterminedThemeName {
  if (typeof window === "undefined") {
    return theme === "dark" ? "dark" : "light"; // default to light if not dark
  }
  if (theme === null || theme === "system") {
    // system preference (default)
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return systemPreference;
  }
  return theme;
}

export function HeadThemeProvider() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var theme = localStorage.getItem('${LocalStorageKeyForTheme}') || '${DefaultThemeName}';
            if (theme === '${"system" as ThemeName}') {
              theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? '${"dark" as DeterminedThemeName}' : '${"light" as DeterminedThemeName}';
            }
            document.documentElement.dataset.theme = theme;
          })();
        `,
      }}
    />
  )
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [storedTheme, setStoredTheme] = React.useState<ThemeName>(getStoredThemeOrDefault);
  const [preferredTheme, setPreferredTheme] = React.useState<DeterminedThemeName>(getPreferredTheme(storedTheme));

  // Save the theme to localStorage and apply it to the document's data-theme attribute
  const setStoredThemeAndApply = (theme: ThemeName) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LocalStorageKeyForTheme, theme);
    }
    setStoredTheme(theme);
    setPreferredTheme(getPreferredTheme(theme));
  }

  // Update the document's data-theme attribute whenever the preferred theme changes
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = preferredTheme;
  }, [preferredTheme]);

  // Update the preferred theme state whenever the system preference changes
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setPreferredTheme(getPreferredTheme(storedTheme));
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    }
  }, [storedTheme]);

  return (
    <StoredThemeContext value={{ theme: storedTheme, setTheme: setStoredThemeAndApply }}>
      <PreferredThemeContext value={preferredTheme}>
        {children}
      </PreferredThemeContext>
    </StoredThemeContext>
  )
}

/**
 * Returns the stored theme and a function to update it.
 */
export function useStoredTheme() {
  const context = React.useContext(StoredThemeContext);
  if (!context) {
    throw new Error("useStoredTheme() must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Returns the preferred theme based on the stored theme and system preference.
 */
export function usePreferredTheme() {
  const context = React.useContext(PreferredThemeContext);
  if (context === undefined) {
    throw new Error("usePreferredTheme() must be used within a ThemeProvider");
  }
  return context;
}
