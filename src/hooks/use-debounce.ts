"use client";

import { useEffect, useRef, useCallback } from "react";

type DebouncedFunction<T extends (...args: Parameters<T>) => ReturnType<T>> = (
  ...args: Parameters<T>
) => void;

export function useDebounce<
  T extends (...args: Parameters<T>) => ReturnType<T>,
>(callback: T, delay: number): DebouncedFunction<T> {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );

  return debouncedCallback;
}

export default useDebounce;
