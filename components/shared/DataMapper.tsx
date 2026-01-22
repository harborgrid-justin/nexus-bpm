
import React, { useState, useRef, useEffect } from 'react';
import { IOMapping } from '../../types';
import { X, ArrowRight, Trash2, Link, Circle, CheckCircle } from 'lucide-react';

interface DataMapperProps {
  mappings: IOMapping[];
  onChange: (newMappings: IOMapping[]) => void;
  sourceSchema: string[]; // Available outputs from previous step
  targetSchema: string[]; // Required inputs for current step
}

export const DataMapper: React.FC<DataMapperProps> = ({ mappings, onChange, sourceSchema, targetSchema }) => {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Helper to get coordinates for connection points
  const getCoords = (key: string, side: 'left' | 'right') => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const el = containerRef.current.querySelector(`[data-key="${side}-${key}"]`);
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: side === 'left' ? (rect.right - containerRect.left) : (rect.left - containerRect.left),
      y: (rect.top - containerRect.top) + (rect.height / 2)
    };
  };

  // State trigger for re-rendering lines after layout changes
  const [layoutTick, setLayoutTick] = useState(0);
  useEffect(() => { setTimeout(() => setLayoutTick(t => t + 1), 100); }, []);

  const handleSourceClick = (key: string) => {
    setSelectedSource(key === selectedSource ? null : key);
  };

  const handleTargetClick = (key: string) => {
    if (selectedSource) {
      // Check if mapping exists
      if (!mappings.find(m => m.source === selectedSource && m.target === key)) {
        onChange([...mappings, { source: selectedSource, target: key }]);
      }
      setSelectedSource(null);
    }
  };

  const removeMapping = (index: number) => {
    const newM = [...mappings];
    newM.splice(index, 1);
    onChange(newM);
  };

  return (
    <div className="flex flex-col h-[300px] select-none" ref={containerRef}>
      <div className="flex justify-between items-center mb-2 px-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Upstream Data</span>
        
        <button 
            onClick={() => onChange([])} 
            disabled={mappings.length === 0}
            className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
        >
            <Trash2 size={10} /> Clear All
        </button>

        <span className="text-[10px] font-bold text-slate-500 uppercase">Task Inputs</span>
      </div>
      
      <div className="flex-1 flex relative border border-slate-200 rounded-sm bg-slate-50 overflow-hidden">
        {/* Source List */}
        <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col overflow-y-auto py-2">
          {sourceSchema.map(key => {
            const isMapped = mappings.some(m => m.source === key);
            const isSelected = selectedSource === key;
            
            return (
                <div 
                key={key} 
                data-key={`left-${key}`}
                onClick={() => handleSourceClick(key)}
                className={`px-3 py-2 text-xs cursor-pointer flex justify-between items-center transition-colors border-l-2 ${
                    isSelected 
                        ? 'bg-blue-50 text-blue-700 font-bold border-blue-600' 
                        : (isMapped ? 'text-emerald-700 bg-emerald-50/30 border-transparent' : 'hover:bg-slate-50 text-slate-700 border-transparent')
                }`}
                >
                <span className="truncate" title={key}>{key}</span>
                {isMapped ? <Link size={10} className="text-emerald-500"/> : <Circle size={8} className={`text-slate-300 ${isSelected ? 'fill-blue-500 text-blue-500' : ''}`} />}
                </div>
            );
          })}
        </div>

        {/* Canvas Layer */}
        <div className="flex-1 relative bg-slate-50/50">
           <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {mappings.map((m, i) => {
                 const start = getCoords(m.source, 'left');
                 const end = getCoords(m.target, 'right');
                 
                 // Render relative to center area
                 const x1 = 0; 
                 const y1 = start.y;
                 const x2 = containerRef.current ? (containerRef.current.clientWidth * 0.33) : 100; // Width of center area approx
                 const y2 = end.y;

                 return (
                   <path 
                     key={i}
                     d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                     stroke="#10b981" 
                     strokeWidth="1.5" 
                     fill="none"
                     className="opacity-60"
                   />
                 );
              })}
           </svg>
           {selectedSource && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded shadow-sm opacity-80 animate-pulse">
                       Select Target...
                   </div>
               </div>
           )}
        </div>

        {/* Target List */}
        <div className="w-1/3 border-l border-slate-200 bg-white flex flex-col overflow-y-auto py-2">
          {targetSchema.map(key => {
             const isMapped = mappings.some(m => m.target === key);
             return (
              <div 
                key={key} 
                data-key={`right-${key}`}
                onClick={() => handleTargetClick(key)}
                className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-2 transition-colors border-r-2 ${
                    isMapped 
                        ? 'text-emerald-700 font-medium bg-emerald-50/30 border-emerald-500' 
                        : (selectedSource ? 'hover:bg-blue-50 cursor-pointer border-transparent' : 'hover:bg-slate-50 text-slate-700 border-transparent')
                }`}
              >
                {isMapped ? <CheckCircle size={10} className="text-emerald-500"/> : <Circle size={8} className="text-slate-300" />}
                <span className="truncate" title={key}>{key}</span>
              </div>
             );
          })}
        </div>
      </div>

      {/* Mapping List Footer */}
      <div className="mt-2 h-20 overflow-y-auto border border-slate-200 bg-white rounded-sm p-2 space-y-1">
         {mappings.length === 0 && <p className="text-[10px] text-slate-400 italic text-center pt-2">Select a source field, then select a target field to map data.</p>}
         {mappings.map((m, i) => (
           <div key={i} className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-sm border border-slate-100 group hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                 <span className="font-bold text-blue-700">{m.source}</span>
                 <ArrowRight size={10} className="text-slate-300"/>
                 <span className="font-bold text-emerald-700">{m.target}</span>
              </div>
              <button onClick={() => removeMapping(i)} className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"><X size={12}/></button>
           </div>
         ))}
      </div>
    </div>
  );
};
