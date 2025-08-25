import { useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext';

type User = AuthContextType['user'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  const login = (u: User) => setUser(u);
  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
