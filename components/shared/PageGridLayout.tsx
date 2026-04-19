
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Settings } from 'lucide-react';
import { useBPM } from '../../contexts/BPMContext';
import { useTheme } from '../../contexts/ThemeContext';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface PageGridLayoutProps {
  defaultLayouts: { lg: Layout[]; md: Layout[]; sm?: Layout[]; xs?: Layout[] };
  children: React.ReactNode | ((props: { isEditable: boolean }) => React.ReactNode);
  toolbarActions?: any[]; 
}

export const PageGridLayout: React.FC<PageGridLayoutProps> = ({ 
  defaultLayouts, 
  children,
  toolbarActions = []
}) => {
  const { setToolbarConfig } = useBPM();
  const { gridConfig, layoutBreakpoints, layoutCols } = useTheme();
  const [isEditable, setIsEditable] = useState(false);

  const layoutsRef = useRef(defaultLayouts);
  layoutsRef.current = defaultLayouts;

  const actionsRef = useRef(toolbarActions);
  actionsRef.current = toolbarActions;

  // Compute a comprehensive layout set to prevent blank screens on smaller breakpoints
  const mergedLayouts = useMemo(() => {
    const base = { ...defaultLayouts };
    
    // Improved inheritance logic: only fallback if the source layout might fit
    // LG to MD is usually safe if we subtract 2 from widths or handle overflow
    // For now, we'll keep it simple but ensure we have at least something for each breakpoint
    const source = base.lg || Object.values(base)[0] as Layout[];
    
    if (source) {
      if (!base.lg) base.lg = source;
      if (!base.md) base.md = source;
      if (!base.sm) base.sm = source;
      if (!base.xs) base.xs = source;
      if (!base.xxs) base.xxs = source;
    }
    return base;
  }, [defaultLayouts]);

  const [layouts, setLayouts] = useState(mergedLayouts);

  // Synchronize layouts when defaultLayouts PROPS change actually (deep equality would be better but expensive)
  // For now we rely on the parent memoizing it.
  useEffect(() => {
    setLayouts(mergedLayouts);
  }, [mergedLayouts]);

  useEffect(() => {
    setToolbarConfig({
      view: [
        { 
          label: isEditable ? 'Lock Layout' : 'Edit Layout', 
          action: () => setIsEditable(!isEditable), 
          icon: Settings 
        },
        { 
          label: 'Reset Layout', 
          action: () => setLayouts(layoutsRef.current) 
        },
        ...actionsRef.current
      ]
    });
    
    // Do NOT clear toolbar config on unmount to avoid flickering and infinite loops between tab switches
  }, [setToolbarConfig, isEditable]);

  const content = typeof children === 'function' ? children({ isEditable }) : children;
  
  // Refined flattening to preserve original keys for React Grid Layout matching
  const flattenedContent = useMemo(() => {
    const arr = Array.isArray(content) ? content : [content];
    return arr.flatMap(child => {
      if (!child) return [];
      if (child.type === React.Fragment) {
        return React.Children.toArray(child.props.children);
      }
      return [child];
    });
  }, [content]);

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={layoutBreakpoints}
      cols={layoutCols}
      rowHeight={gridConfig.rowHeight}
      margin={gridConfig.margin}
      isDraggable={isEditable}
      isResizable={isEditable}
      draggableHandle=".drag-handle"
      onLayoutChange={(curr, all) => setLayouts(all)}
    >
      {flattenedContent}
    </ResponsiveGridLayout>
  );
};
