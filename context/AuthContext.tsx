"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore, useMemo } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export interface SimulatedUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | SimulatedUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  simulateLogin: (name?: string, email?: string) => void;
  isSimulated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  simulateLogin: () => {},
  isSimulated: false,
});

function subscribeSimStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("icat_sim_user_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("icat_sim_user_change", callback);
  };
}

function getSimSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("icat_simulated_user");
}

function getSimServerSnapshot(): null {
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);

  // Subscribe to simulated user via useSyncExternalStore (0 SSR hydration mismatch, no setState in effect)
  const rawSimUser = useSyncExternalStore(subscribeSimStorage, getSimSnapshot, getSimServerSnapshot);
  
  const simulatedUser = useMemo<SimulatedUser | null>(() => {
    if (!rawSimUser) return null;
    try {
      return JSON.parse(rawSimUser) as SimulatedUser;
    } catch {
      return null;
    }
  }, [rawSimUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setFirebaseLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(result.user);
      if (typeof window !== "undefined") {
        localStorage.removeItem("icat_simulated_user");
        window.dispatchEvent(new Event("icat_sim_user_change"));
      }
    } catch (error: unknown) {
      console.error("Google Sign-In error:", error);
      throw error;
    } finally {
      setFirebaseLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("icat_simulated_user");
        window.dispatchEvent(new Event("icat_sim_user_change"));
      }
      await firebaseSignOut(auth);
      setFirebaseUser(null);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const simulateLogin = (name = "Player_Zero", email = "player.zero@urban.game") => {
    const simUser: SimulatedUser = {
      uid: `demo_usr_${Math.random().toString(36).substring(2, 9)}`,
      displayName: name,
      email: email,
      photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=urban_gamer"
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("icat_simulated_user", JSON.stringify(simUser));
      window.dispatchEvent(new Event("icat_sim_user_change"));
    }
  };

  const user = firebaseUser || simulatedUser;
  const isSimulated = !firebaseUser && !!simulatedUser;
  const loading = firebaseLoading && !simulatedUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOutUser,
        simulateLogin,
        isSimulated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
