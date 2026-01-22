
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Density = 'compact' | 'comfortable' | 'spacious';
type ThemeMode = 'light' | 'dark' | 'system';

interface GridConfig {
  rowHeight: number;
  margin: [number, number];
}

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
  gridConfig: GridConfig;
  layoutBreakpoints: Record<string, number>;
  layoutCols: Record<string, number>;
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
      compact: { space: '0.5rem', padding: '12px', gap: '12px', cardPadding: '16px', sectionGap: '16px' },
      comfortable: { space: '0.75rem', padding: '24px', gap: '24px', cardPadding: '24px', sectionGap: '32px' },
      spacious: { space: '1.25rem', padding: '32px', gap: '32px', cardPadding: '32px', sectionGap: '40px' }
    };
    const d = densityMap[density];
    root.style.setProperty('--space-base', d.space);
    root.style.setProperty('--layout-padding', d.padding);
    root.style.setProperty('--layout-gap', d.gap);
    root.style.setProperty('--card-padding', d.cardPadding);
    root.style.setProperty('--section-gap', d.sectionGap);

    // Shadows & Depth
    root.style.setProperty('--shadow-subtle', '0 1px 2px 0 rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--shadow-depth', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)');

    // Theme Mode
    if (themeMode === 'dark') {
        body.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
    } else {
        body.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
    }

  }, [scale, sidebarWidth, headerHeight, radius, density, themeMode]);

  const gridConfig: GridConfig = {
      compact: { rowHeight: 20, margin: [12, 12] as [number, number] },
      comfortable: { rowHeight: 30, margin: [16, 16] as [number, number] },
      spacious: { rowHeight: 40, margin: [24, 24] as [number, number] }
  }[density];

  // Standardized Responsive Breakpoints
  const layoutBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  
  // Standardized Column Counts
  const layoutCols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

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
      gridConfig,
      layoutBreakpoints,
      layoutCols,
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
