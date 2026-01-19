import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Density = 'compact' | 'comfortable' | 'spacious';

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
  resetTheme: () => void;
}

const defaultTheme = {
  scale: 1,
  sidebarWidth: 256,
  headerHeight: 56,
  radius: 2,
  density: 'comfortable' as Density
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scale, setScale] = useState(defaultTheme.scale);
  const [sidebarWidth, setSidebarWidth] = useState(defaultTheme.sidebarWidth);
  const [headerHeight, setHeaderHeight] = useState(defaultTheme.headerHeight);
  const [radius, setRadius] = useState(defaultTheme.radius);
  const [density, setDensity] = useState<Density>(defaultTheme.density);

  useEffect(() => {
    const root = document.documentElement;
    
    // 1. Global Scale (Affects rem units: padding, margin, font-size)
    // Tailwind base is 16px. We adjust this percentage.
    root.style.fontSize = `${scale * 100}%`; 

    // 2. Layout Dimensions (Independent of scale to allow precise control)
    root.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    root.style.setProperty('--header-height', `${headerHeight}px`);
    
    // 3. Component Styling
    root.style.setProperty('--radius-base', `${radius}px`);

    // 4. Density & Spacing (Affects specific spacing variables)
    const densityMap = {
      compact: { 
        space: '0.5rem', 
        text: '12px',
        padding: '16px',
        gap: '12px' 
      },
      comfortable: { 
        space: '0.75rem', 
        text: '13px', 
        padding: '32px', 
        gap: '24px' 
      },
      spacious: { 
        space: '1.25rem', 
        text: '14px', 
        padding: '48px', 
        gap: '40px' 
      }
    };
    
    const d = densityMap[density];
    root.style.setProperty('--space-base', d.space);
    root.style.setProperty('--text-base', d.text);
    root.style.setProperty('--layout-padding', d.padding);
    root.style.setProperty('--layout-gap', d.gap);

  }, [scale, sidebarWidth, headerHeight, radius, density]);

  const resetTheme = () => {
    setScale(defaultTheme.scale);
    setSidebarWidth(defaultTheme.sidebarWidth);
    setHeaderHeight(defaultTheme.headerHeight);
    setRadius(defaultTheme.radius);
    setDensity(defaultTheme.density);
  };

  return (
    <ThemeContext.Provider value={{
      scale, setScale,
      sidebarWidth, setSidebarWidth,
      headerHeight, setHeaderHeight,
      radius, setRadius,
      density, setDensity,
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