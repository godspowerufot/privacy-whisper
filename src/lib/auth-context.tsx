"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "wagmi";

export type UserRole = "journalist" | "whisperer";

interface AuthContextType {
  role: UserRole | null;
  isConnected: boolean;
  connect: (role: UserRole) => void;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAccount();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Automatically disconnect role if wallet is disconnected
  useEffect(() => {
    if (status === "disconnected" && role !== null) {
      disconnect();
    }
  }, [status, role]);

  useEffect(() => {
    const savedRole = localStorage.getItem("zama_role") as UserRole | null;
    if (savedRole && (savedRole === "journalist" || savedRole === "whisperer")) {
      setRole(savedRole);
    }
    setIsLoaded(true);
  }, []);

  const connect = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem("zama_role", newRole);
  };

  const disconnect = () => {
    setRole(null);
    localStorage.removeItem("zama_role");
  };

  if (!isLoaded) return null; // Avoid hydration mismatch or flash of unauthenticated state

  return (
    <AuthContext.Provider value={{ role, isConnected: !!role, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
