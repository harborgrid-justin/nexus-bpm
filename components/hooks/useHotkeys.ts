
import { useEffect } from 'react';

export const useHotkeys = (key: string, callback: () => void, ctrlKey: boolean = false) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase()) {
          if (ctrlKey && !(event.metaKey || event.ctrlKey)) return;
          event.preventDefault();
          callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, ctrlKey]);
};
