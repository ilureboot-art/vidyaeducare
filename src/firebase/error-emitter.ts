/**
 * @fileOverview A central event emitter for Firebase errors.
 */

type ErrorCallback = (error: any) => void;

class FirebaseErrorEmitter {
  private listeners: Record<string, ErrorCallback[]> = {};

  emit(channel: string, error: any) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach((cb) => cb(error));
    }
  }

  on(channel: string, callback: ErrorCallback) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);
    return () => {
      this.listeners[channel] = this.listeners[channel].filter((cb) => cb !== callback);
    };
  }
}

export const errorEmitter = new FirebaseErrorEmitter();
