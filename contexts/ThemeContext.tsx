
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
  scale: 0.95, // Start slightly smaller for crisp enterprise look
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
    
    // 1. Dynamic Root Scaling (Zoom)
    root.style.fontSize = `${scale * 100}%`;

    // 2. Layout Dimensions
    root.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    root.style.setProperty('--header-height', `${headerHeight}px`);
    
    // 3. Component Styling
    root.style.setProperty('--radius-base', `${radius}px`);
    
    // 4. Density Map (Compass SaaS Logic)
    const densityMap = {
      compact: { 
        space: '0.5rem',        // 8px internal spacing
        padding: '16px',        // Container padding
        gap: '12px',            // Grid/Flex gaps
        cardPadding: '12px',    // Tighter cards
        sectionGap: '16px',     // Vertical rhythm
        inputHeight: '32px',    // Dense inputs
        fontSize: '0.8125rem'   // 13px Base Text
      },
      comfortable: { 
        space: '0.75rem',       // 12px internal spacing
        padding: '24px',        // Standard padding
        gap: '20px',            // Breathable gaps
        cardPadding: '20px',    // Standard cards
        sectionGap: '24px',     // Standard rhythm
        inputHeight: '38px',    // Standard inputs
        fontSize: '0.875rem'    // 14px Base Text
      },
      spacious: { 
        space: '1rem',          // 16px internal spacing
        padding: '32px',        // Deep padding
        gap: '32px',            // Wide gaps
        cardPadding: '32px',    // Airy cards
        sectionGap: '40px',     // Distinct separation
        inputHeight: '44px',    // Touch-friendly inputs
        fontSize: '1rem'        // 16px Base Text
      }
    };
    
    const d = densityMap[density];
    root.style.setProperty('--space-base', d.space);
    root.style.setProperty('--layout-padding', d.padding);
    root.style.setProperty('--layout-gap', d.gap);
    root.style.setProperty('--card-padding', d.cardPadding);
    root.style.setProperty('--section-gap', d.sectionGap);
    
    // Dynamic Component Vars
    root.style.setProperty('--input-height', d.inputHeight);
    root.style.setProperty('--text-base-size', d.fontSize);

    // Shadows & Depth (Refined for cleanliness)
    root.style.setProperty('--shadow-subtle', '0 1px 2px 0 rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--shadow-depth', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)');

    // Theme Mode Class Handling
    if (themeMode === 'dark') {
        body.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
    } else {
        body.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
    }

  }, [scale, sidebarWidth, headerHeight, radius, density, themeMode]);

  // Refined Grid Config for alignment
  const gridConfig: GridConfig = {
      compact: { rowHeight: 20, margin: [12, 12] as [number, number] },
      comfortable: { rowHeight: 30, margin: [20, 20] as [number, number] },
      spacious: { rowHeight: 40, margin: [32, 32] as [number, number] }
  }[density];

  const layoutBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
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
