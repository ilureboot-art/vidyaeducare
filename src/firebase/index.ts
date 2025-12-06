'use client';

// This barrel file re-exports the core hooks from the main provider.
// All components should import their necessary Firebase hooks from here.

import { useAuth, useAuthService, useDb } from './provider';

// Re-exporting for easy access and a single point of import.
export { useAuth, useAuthService, useDb };
