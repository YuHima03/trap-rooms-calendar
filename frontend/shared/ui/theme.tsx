'use client';

import React, { useLayoutEffect } from "react";
import { DeterminedThemeName, isThemeName, ThemeName } from "../config/themes";

const DefaultThemeName = "system";

const ThemeContext = React.createContext<{
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
} | null>(null);

const localStorageKey = "theme";

function getStoredThemeOrDefault(): ThemeName {
    if (typeof window === "undefined") {
        return DefaultThemeName;
    }
    const storedTheme = localStorage.getItem(localStorageKey);
    if (storedTheme && isThemeName(storedTheme)) {
        return storedTheme;
    }
    return DefaultThemeName;
}

function getPreferredThemeCore(theme: ThemeName | null): DeterminedThemeName {
    if (typeof window === "undefined") {
        return "light";
    }
    if (theme === null || theme === "system") {
        // system preference (default)
        const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        return systemPreference;
    }
    return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = React.useState<ThemeName>(getStoredThemeOrDefault);
    const setThemeAndStore = (theme: ThemeName) => {
        if (typeof window !== "undefined") {
            localStorage.setItem(localStorageKey, theme);
        }
        setTheme(getPreferredThemeCore(theme));
    }

    // Update the document's data-theme attribute whenever the theme changes
    useLayoutEffect(() => {
        document.documentElement.dataset.theme = getPreferredThemeCore(theme);
    }, [theme]);

    // Update the theme state whenever the system preference changes
    useLayoutEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            document.documentElement.dataset.theme = getPreferredThemeCore(theme);
        }
        mediaQuery.addEventListener("change", handleChange);
        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        }
    }, []);

    return (
        <ThemeContext value={{ theme, setTheme: setThemeAndStore }}>
            {children}
        </ThemeContext>
    )
}

export function useTheme() {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme() must be used within a ThemeProvider");
    }
    return context;
}
