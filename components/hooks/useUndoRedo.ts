
import { useState, useCallback } from 'react';

export default function useUndoRedo<T>(initialState: T, limit: number = 20) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback((newPresent: T) => {
    setPast((prev) => {
      const newPast = [...prev, present];
      if (newPast.length > limit) newPast.shift();
      return newPast;
    });
    setPresent(newPresent);
    setFuture([]);
  }, [present, limit]);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const newPresent = prev[prev.length - 1];
      const newPast = prev.slice(0, prev.length - 1);
      
      setFuture((f) => [present, ...f]);
      setPresent(newPresent);
      
      return newPast;
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const newPresent = prev[0];
      const newFuture = prev.slice(1);
      
      setPast((p) => [...p, present]);
      setPresent(newPresent);
      
      return newFuture;
    });
  }, [present]);

  return { state: present, set, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0, history: past };
}
