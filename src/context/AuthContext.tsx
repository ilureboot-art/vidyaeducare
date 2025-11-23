
"use client";

import { createContext } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isHeadAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

    