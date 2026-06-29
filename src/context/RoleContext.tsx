import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';
import { mockUsers } from '../mock/users';

interface RoleContextValue {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  allUsers: User[];
  setCurrentUser: (user: User) => void;
  updateUser: (updated: User) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);

  const login = (user: User) => setCurrentUser(user);
  const logout = () => setCurrentUser(null);

  const updateUser = (updated: User) => {
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    // If the updated user is the currently logged-in one, sync their session too
    if (currentUser?.id === updated.id) setCurrentUser(updated);
  };

  return (
    <RoleContext.Provider
      value={{ currentUser, isLoggedIn: currentUser !== null, login, logout, allUsers, setCurrentUser, updateUser }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
