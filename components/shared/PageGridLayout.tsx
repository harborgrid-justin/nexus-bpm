
import React, { useState, useEffect } from 'react';
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
  const [layouts, setLayouts] = useState(defaultLayouts);
  const [isEditable, setIsEditable] = useState(false);

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
          action: () => setLayouts(defaultLayouts) 
        },
        ...toolbarActions
      ]
    });
  }, [setToolbarConfig, isEditable, defaultLayouts, toolbarActions]);

  const content = typeof children === 'function' ? children({ isEditable }) : children;

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
      {content}
    </ResponsiveGridLayout>
  );
};
