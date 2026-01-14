import { useEffect } from 'react';

type KeyHandler = {
  key: string;
  handler: () => void;
  ctrl?: boolean;
  shift?: boolean;
};

export const useKeyboardShortcuts = (handlers: KeyHandler[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handlers.forEach(({ key, handler, ctrl = false, shift = false }) => {
        // Check for key match
        const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();
        
        // Check for modifier match
        // event.metaKey covers Command on Mac, event.ctrlKey covers Control on Windows/Linux
        // We generally treat "ctrl" in our config as "Command or Control" for cross-platform convenience usually,
        // but strict interpretation: 
        // If ctrl is true, we check (metaKey OR ctrlKey) to be user-friendly on Mac vs Windows.
        const isCtrlMatch = ctrl 
          ? (event.metaKey || event.ctrlKey) 
          : !event.metaKey && !event.ctrlKey;
          
        const isShiftMatch = shift ? event.shiftKey : !event.shiftKey;

        if (isKeyMatch && isCtrlMatch && isShiftMatch) {
          event.preventDefault();
          handler();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
};

export default useKeyboardShortcuts;
