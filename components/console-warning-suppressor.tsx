'use client';

import { useEffect } from 'react';

export function ConsoleWarningSuppressor() {
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Support for defaultProps will be removed from function components')
      ) {
        // Suppress this specific React warning usually caused by Recharts
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('was preloaded using link preload but not used within a few seconds')
      ) {
        // Suppress Next.js development CSS preload warning
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      // Restore on unmount (though this usually stays for the whole app lifetime)
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return null;
}
