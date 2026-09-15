"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppUser } from "../types";
import { auth } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  canManageSystem: boolean;
  canManagePrinters: boolean;
  canPerformOperations: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  canManageSystem: true,
  canManagePrinters: true,
  canPerformOperations: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email || "admin@truong.edu.vn",
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Quản trị viên",
          role: "super_admin",
          status: "active",
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth chưa được khởi tạo");
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const appUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: cred.user.displayName || email.split("@")[0] || "Quản trị viên",
        role: "super_admin",
        status: "active",
      };
      setUser(appUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (auth) {
        await fbSignOut(auth);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        canManageSystem: true,
        canManagePrinters: true,
        canPerformOperations: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
