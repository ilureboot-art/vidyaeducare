'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * A global listener that catches contextual Firebase errors and throws them
 * as uncaught exceptions to trigger the Next.js development error overlay.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error) => {
      // Throwing the error here ensures it reaches the dev overlay
      // without being swallowed by component local try/catches.
      throw error;
    });

    return () => unsubscribe();
  }, []);

  return null;
}
