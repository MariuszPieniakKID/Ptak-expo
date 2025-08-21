import { createContext } from 'react';

type User = { id: number; name: string; email: string } | null;

export interface AuthContextType {
  user: User;
  login: (u: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
