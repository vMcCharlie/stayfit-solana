import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_IDENTITY = {
  name: "StayFit",
  uri: "https://stayfit-seeker.app",
  icon: "favicon.ico",
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string, type: "email" | "signup" | "recovery") => Promise<{ data: { session: Session | null; user: User | null }; error: any }>;
  signInWithOtp: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => Promise<void>;
  profileUpdated: number;
  triggerProfileRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileUpdated, setProfileUpdated] = useState<number>(0);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Allow creating new users (signup) or logging in existing
      },
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string, type: "email" | "signup" | "recovery" = "email") => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const connectWallet = async (): Promise<string> => {
    try {
      let transact: any;
      try {
        const mwa = require("@solana-mobile/mobile-wallet-adapter-protocol-web3js");
        transact = mwa.transact;
      } catch (importErr) {
        console.warn("Solana Mobile Wallet Adapter not available (likely running in Expo Go)");
        throw new Error("Wallet connection is not available in this environment. Please use a custom dev build to connect your wallet.");
      }

      const { PublicKey } = require("@solana/web3.js");

      let newWalletAddress = "";
      await transact(async (wallet: any) => {
        const authorizationResult = await wallet.authorize({
          cluster: "mainnet-beta",
          identity: APP_IDENTITY,
        });

        // Mobile Wallet Adapter returns address as Uint8Array/binary
        // We must convert it to Base58 string
        const addressUint8 = authorizationResult.accounts[0].address;
        newWalletAddress = new PublicKey(addressUint8).toBase58();
      });

      console.log("Connected wallet address (Base58):", newWalletAddress);

      // Store wallet address in user metadata if we have a session
      if (session?.user && newWalletAddress) {
        // 1. Call Edge Function to safely update profile (with service role)
        const { data, error } = await supabase.functions.invoke('rewards-manager', {
          body: {
            action: 'update_wallet_address',
            wallet_address: newWalletAddress
          }
        });

        if (error) {
          console.error("Error updating wallet address via edge function:", error);
          // Fallback to direct update if edge function fails (though edge function is preferred)
          await supabase
            .from('profiles')
            .update({ wallet_address: newWalletAddress })
            .eq('id', session.user.id);
        }

        // 2. Update local metadata for session consistency
        await supabase.auth.updateUser({
          data: { wallet_address: newWalletAddress }
        });

        // 3. Save locally
        await AsyncStorage.setItem(`wallet_address_${session.user.id}`, newWalletAddress);

        // 4. Trigger refresh
        triggerProfileRefresh();
      }

      return newWalletAddress;
    } catch (err: any) {
      console.error("Wallet connection failed", err);
      throw err;
    }
  };

  const disconnectWallet = async () => {
    try {
      setLoading(true);
      if (session?.user) {
        // 1. Call Edge Function to safely remove wallet address
        const { error } = await supabase.functions.invoke('rewards-manager', {
          body: {
            action: 'update_wallet_address',
            wallet_address: null
          }
        });

        if (error) {
          console.error("Error unlinking wallet via edge function:", error);
          // Fallback to direct update
          await supabase
            .from('profiles')
            .update({ wallet_address: null })
            .eq('id', session.user.id);
        }

        // 2. Remove from local user metadata
        await supabase.auth.updateUser({
          data: { wallet_address: null }
        });

        // 3. Remove from storage
        await AsyncStorage.removeItem(`wallet_address_${session.user.id}`);

        // 4. Update local state
        triggerProfileRefresh();
      }
    } catch (err: any) {
      console.error("Wallet disconnection failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger profile refresh across components
  const triggerProfileRefresh = () => {
    console.log("Triggering profile refresh");
    setProfileUpdated(Date.now());
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithOtp,
    verifyOtp,
    signOut,
    forgotPassword,
    connectWallet,
    disconnectWallet,
    profileUpdated,
    triggerProfileRefresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
