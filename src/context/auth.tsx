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
  skrBalance: number;
  skrTier: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileUpdated, setProfileUpdated] = useState<number>(0);
  const [skrBalance, setSkrBalance] = useState<number>(0);
  const [skrTier, setSkrTier] = useState<string>("None");

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

  // SKR Token Logic
  const SKR_TOKEN_ADDRESS = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

  const getTier = (balance: number): string => {
    if (balance >= 400000) return "Platinum";
    if (balance >= 40000) return "Gold";
    if (balance >= 4000) return "Silver";
    if (balance >= 1) return "Bronze";
    return "None";
  };

  const fetchSkrBalance = async () => {
    try {
      const storedWallet = await AsyncStorage.getItem(`wallet_address_${user?.id}`);
      const walletAddress = user?.user_metadata?.wallet_address || storedWallet;

      if (!walletAddress) {
        setSkrBalance(0);
        setSkrTier("None");
        return;
      }

      const { Connection, PublicKey } = require("@solana/web3.js");
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const owner = new PublicKey(walletAddress);
      const mint = new PublicKey(SKR_TOKEN_ADDRESS);

      const response = await connection.getParsedTokenAccountsByOwner(owner, { mint });

      if (response.value.length > 0) {
        const amount = response.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
        setSkrBalance(amount);
        setSkrTier(getTier(amount));
      } else {
        setSkrBalance(0);
        setSkrTier("None");
      }
    } catch (err) {
      console.warn("[AuthContext] Failed to fetch SKR balance:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSkrBalance();
    } else {
      setSkrBalance(0);
      setSkrTier("None");
    }
  }, [user, profileUpdated]);

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
    skrBalance,
    skrTier,
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
