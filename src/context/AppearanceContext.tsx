import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEYS = {
    compact: 'simrs_compact',
    sidebar: 'simrs_sidebar_collapsed',
};

interface AppearanceContextType {
    isCompact: boolean;
    sidebarCollapsed: boolean;
    setCompact: (on: boolean) => void;
    setSidebarCollapsed: (on: boolean) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
    const [isCompact, setIsCompact] = useState(() => localStorage.getItem(STORAGE_KEYS.compact) === 'true');
    const [sidebarCollapsed, setSidebarCollapsedState] = useState(
        () => localStorage.getItem(STORAGE_KEYS.sidebar) === 'true'
    );

    // Always ensure light mode — remove dark class if it exists
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.removeItem('simrs_theme');
    }, []);

    // Apply compact mode class to <body>
    useEffect(() => {
        document.body.classList.toggle('compact', isCompact);
        localStorage.setItem(STORAGE_KEYS.compact, String(isCompact));
    }, [isCompact]);

    const setCompact = (on: boolean) => setIsCompact(on);
    const setSidebarCollapsed = (on: boolean) => {
        setSidebarCollapsedState(on);
        localStorage.setItem(STORAGE_KEYS.sidebar, String(on));
    };

    return (
        <AppearanceContext.Provider value={{ isCompact, sidebarCollapsed, setCompact, setSidebarCollapsed }}>
            {children}
        </AppearanceContext.Provider>
    );
};

export const useAppearance = (): AppearanceContextType => {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
    return context;
};
