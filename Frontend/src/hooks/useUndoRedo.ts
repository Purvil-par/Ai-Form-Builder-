/**
 * Undo/Redo Hook for Form Editor
 * Manages history state with keyboard shortcuts
 */

import { useState, useCallback, useEffect } from 'react';

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const actualNewState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prev[currentIndex])
        : newState;

      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(actualNewState);
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        setCurrentIndex(maxHistory - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    clearHistory,
  };
}
