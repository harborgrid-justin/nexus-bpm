
import { useState, useCallback } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export default function useUndoRedo<T>(initialState: T, limit: number = 20) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const { past, present, future } = history;

  const set = useCallback((newPresent: T) => {
    setHistory((curr) => {
      const newPast = [...curr.past, curr.present];
      if (newPast.length > limit) newPast.shift();
      return {
        past: newPast,
        present: newPresent,
        future: []
      };
    });
  }, [limit]);

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  return { 
    state: present, 
    set, 
    undo, 
    redo, 
    canUndo: past.length > 0, 
    canRedo: future.length > 0, 
    history: past 
  };
}
