"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
// import type { User } from "@supabase/supabase-js";

import { getUser } from "@/lib/supabase/client";
import { CombinedUserData } from "@/types/combined_user_data";

interface UserContextType {
  user: CombinedUserData | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

type UserProviderProps = {
  children: ReactNode;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<any>(null);

  const refreshUser = async () => {
    const { user: authUser } = await getUser();
    setUser(authUser);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, refreshUser }}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
