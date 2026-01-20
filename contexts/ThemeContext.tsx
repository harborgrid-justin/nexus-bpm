
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Density = 'compact' | 'comfortable' | 'spacious';
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  scale: number;
  setScale: (n: number) => void;
  sidebarWidth: number;
  setSidebarWidth: (n: number) => void;
  headerHeight: number;
  setHeaderHeight: (n: number) => void;
  radius: number;
  setRadius: (n: number) => void;
  density: Density;
  setDensity: (d: Density) => void;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  resetTheme: () => void;
}

const defaultTheme = {
  scale: 1,
  sidebarWidth: 256,
  headerHeight: 56,
  radius: 6,
  density: 'comfortable' as Density,
  themeMode: 'light' as ThemeMode
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scale, setScale] = useState(defaultTheme.scale);
  const [sidebarWidth, setSidebarWidth] = useState(defaultTheme.sidebarWidth);
  const [headerHeight, setHeaderHeight] = useState(defaultTheme.headerHeight);
  const [radius, setRadius] = useState(defaultTheme.radius);
  const [density, setDensity] = useState<Density>(defaultTheme.density);
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultTheme.themeMode);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Layout Dimensions
    root.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    root.style.setProperty('--header-height', `${headerHeight}px`);
    
    // Component Styling
    root.style.setProperty('--radius-base', `${radius}px`);
    
    // Density
    const densityMap = {
      compact: { space: '0.5rem', padding: '16px', gap: '12px', cardPadding: '12px', sectionGap: '16px' },
      comfortable: { space: '0.75rem', padding: '32px', gap: '24px', cardPadding: '24px', sectionGap: '32px' },
      spacious: { space: '1.25rem', padding: '48px', gap: '40px', cardPadding: '32px', sectionGap: '48px' }
    };
    const d = densityMap[density];
    root.style.setProperty('--space-base', d.space);
    root.style.setProperty('--layout-padding', d.padding);
    root.style.setProperty('--layout-gap', d.gap);
    root.style.setProperty('--card-padding', d.cardPadding);
    root.style.setProperty('--section-gap', d.sectionGap);

    // Theme Mode
    if (themeMode === 'dark') {
        body.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
    } else {
        body.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
    }

  }, [scale, sidebarWidth, headerHeight, radius, density, themeMode]);

  const resetTheme = () => {
    setScale(defaultTheme.scale);
    setSidebarWidth(defaultTheme.sidebarWidth);
    setHeaderHeight(defaultTheme.headerHeight);
    setRadius(defaultTheme.radius);
    setDensity(defaultTheme.density);
    setThemeMode(defaultTheme.themeMode);
  };

  return (
    <ThemeContext.Provider value={{
      scale, setScale,
      sidebarWidth, setSidebarWidth,
      headerHeight, setHeaderHeight,
      radius, setRadius,
      density, setDensity,
      themeMode, setThemeMode,
      resetTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
