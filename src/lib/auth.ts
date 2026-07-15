import { createContext, useContext } from 'react';
import type { User } from '@netlify/identity';

export const AuthContext = createContext<{ user: User | null; signOut: () => Promise<void> }>({ user: null, signOut: async () => undefined });
export const useAuth = () => useContext(AuthContext);
