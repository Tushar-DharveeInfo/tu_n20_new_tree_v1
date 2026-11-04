/**
 * Error Boundary and Cleanup Utilities
 * Production-ready error handling with zero memory leaks
 */

import { useEffect, useRef } from 'react';
import ErrorBoundary, { ErrorBoundaryProps } from '../errorboundary/ErrorBoundary';

export { ErrorBoundary };
export type { ErrorBoundaryProps };

/**
 * Cleanup Hook
 * Ensures proper cleanup of resources to prevent memory leaks
 */
export function useCleanup(cleanup: () => void, deps: unknown[] = []): void {
  const cleanupRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    cleanupRef.current = cleanup;

    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
        cleanupRef.current = null;
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Safe Async Operation
 * Wraps async operations with proper error handling and abort support
 */
export class SafeAsync {
  private abortController: AbortController | null = null;
  private isActive = true;

  constructor() {
    this.abortController = new AbortController();
  }

  get signal(): AbortSignal {
    if (!this.abortController) {
      throw new Error('SafeAsync has been disposed');
    }
    return this.abortController.signal;
  }

  abort(): void {
    if (this.abortController && this.isActive) {
      try {
        this.abortController.abort();
      } catch (error) {
        console.warn('Error aborting operation:', error);
      }
    }
  }

  dispose(): void {
    this.abort();
    this.isActive = false;
    this.abortController = null;
  }

  isAborted(): boolean {
    return this.abortController?.signal.aborted ?? true;
  }

  /**
   * Execute async operation with automatic cleanup
   */
  async execute<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T | null> {
    if (!this.isActive || !this.abortController) {
      console.warn('SafeAsync operation called after disposal');
      return null;
    }

    try {
      return await operation(this.signal);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Abort is expected, don't treat as error
        return null;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      console.error('SafeAsync operation failed:', err);
      
      if (onError) {
        onError(err);
      }
      
      return null;
    }
  }
}

/**
 * Resource Manager
 * Manages lifecycle of resources with automatic cleanup
 */
export class ResourceManager {
  private resources: Set<() => void> = new Set();
  private isDisposed = false;

  register(cleanup: () => void): void {
    if (this.isDisposed) {
      console.warn('Cannot register resource on disposed ResourceManager');
      cleanup();
      return;
    }
    this.resources.add(cleanup);
  }

  unregister(cleanup: () => void): void {
    this.resources.delete(cleanup);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;

    // Execute all cleanup functions
    for (const cleanup of this.resources) {
      try {
        cleanup();
      } catch (error) {
        console.error('Resource cleanup error:', error);
      }
    }

    this.resources.clear();
  }

  isResourceDisposed(): boolean {
    return this.isDisposed;
  }
}

/**
 * Debounce utility with cleanup
 */
export function createDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): [(...args: Parameters<T>) => void, () => void] {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return [debouncedFn, cancel];
}

/**
 * Throttle utility with cleanup
 */
export function createThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): [(...args: Parameters<T>) => void, () => void] {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastRan = 0;

  const throttledFn = (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRan >= delay) {
      fn(...args);
      lastRan = now;
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        fn(...args);
        lastRan = Date.now();
        timeoutId = null;
      }, delay - (now - lastRan));
    }
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return [throttledFn, cancel];
}
