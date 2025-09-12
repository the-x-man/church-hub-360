import { useEffect, useRef, useState } from 'react';

/**
 * A generic debounce hook that delays the execution of a function until after a specified delay.
 * 
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns An object containing the pending state and a function to trigger the debounced callback
 */
export function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = (...args: T) => {
    setIsPending(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      setIsPending(false);
    }, delay);
  };

  return {
    isPending,
    debouncedCallback
  };
}

/**
 * A simpler debounce hook for values that automatically triggers when the value changes.
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}