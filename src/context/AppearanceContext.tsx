import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEYS = {
    theme: 'simrs_theme',
    compact: 'simrs_compact',
    sidebar: 'simrs_sidebar_collapsed',
};

interface AppearanceContextType {
    isDark: boolean;
    isCompact: boolean;
    sidebarCollapsed: boolean;
    setTheme: (dark: boolean) => void;
    setCompact: (on: boolean) => void;
    setSidebarCollapsed: (on: boolean) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
    // Default is ALWAYS light — only dark if user explicitly saved 'dark'
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.theme);
        return stored === 'dark'; // only true if explicitly 'dark', not on first load (null)
    });
    const [isCompact, setIsCompact] = useState(() => localStorage.getItem(STORAGE_KEYS.compact) === 'true');
    const [sidebarCollapsed, setSidebarCollapsedState] = useState(
        () => localStorage.getItem(STORAGE_KEYS.sidebar) === 'true'
    );

    // Apply dark mode class to <html> whenever isDark changes
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
    }, [isDark]);

    // Apply compact mode class to <body>
    useEffect(() => {
        document.body.classList.toggle('compact', isCompact);
        localStorage.setItem(STORAGE_KEYS.compact, String(isCompact));
    }, [isCompact]);

    const setTheme = (dark: boolean) => setIsDark(dark);
    const setCompact = (on: boolean) => setIsCompact(on);
    const setSidebarCollapsed = (on: boolean) => {
        setSidebarCollapsedState(on);
        localStorage.setItem(STORAGE_KEYS.sidebar, String(on));
    };

    return (
        <AppearanceContext.Provider value={{ isDark, isCompact, sidebarCollapsed, setTheme, setCompact, setSidebarCollapsed }}>
            {children}
        </AppearanceContext.Provider>
    );
};

export const useAppearance = (): AppearanceContextType => {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
    return context;
};
