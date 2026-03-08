import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

const APP_IDENTITY = {
  name: "StayFit",
  uri: "https://gostay.fit",
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
  walletAddress: string | null;
  skrBalance: number;
  skrTier: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileUpdated, setProfileUpdated] = useState<number>(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [skrBalance, setSkrBalance] = useState<number>(0);
  const [skrTier, setSkrTier] = useState<string>("None");

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);

      // Initialize wallet address from metadata
      if (u?.user_metadata?.wallet_address) {
        setWalletAddress(u.user_metadata.wallet_address);
      }

      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);

      if (u?.user_metadata?.wallet_address) {
        setWalletAddress(u.user_metadata.wallet_address);
      } else if (!u) {
        setWalletAddress(null);
      }

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
      const currentWallet = walletAddress || user?.user_metadata?.wallet_address;

      if (!currentWallet) {
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
  }, [user, profileUpdated, walletAddress]);

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
    try {
      await api.clearApiCache();
    } catch (err) {
      console.warn("[AuthContext] Failed to clear API cache during signOut:", err);
    }
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
      let signature = "";
      let message = "";

      await transact(async (wallet: any) => {
        const storedAuthToken = session?.user
          ? await AsyncStorage.getItem(`wallet_auth_token_${session.user.id}`)
          : null;

        let authorizationResult: any;

        if (storedAuthToken) {
          try {
            authorizationResult = await wallet.reauthorize({
              auth_token: storedAuthToken,
              identity: APP_IDENTITY,
            });
          } catch (reauthErr) {
            console.log("Reauthorization failed, falling back to authorize", reauthErr);
            authorizationResult = await wallet.authorize({
              cluster: "mainnet-beta",
              identity: APP_IDENTITY,
            });
          }
        } else {
          authorizationResult = await wallet.authorize({
            cluster: "mainnet-beta",
            identity: APP_IDENTITY,
          });
        }

        const addressUint8 = authorizationResult.accounts[0].address;
        const { Buffer } = require("buffer");
        newWalletAddress = new PublicKey(Buffer.from(addressUint8, 'base64')).toBase58();
        const authToken = authorizationResult.auth_token;

        // Save authToken for future sessions
        if (authToken && session?.user) {
          await AsyncStorage.setItem(`wallet_auth_token_${session.user.id}`, authToken);
        }

        // 2. Sign Message to verify ownership
        // We always sign a message during "connection" to confirm the user is actively proving ownership
        const timestamp = Date.now();
        message = `Sign-in to StayFit Seeker: ${session?.user?.id} at ${timestamp}`;
        const messageUint8 = new TextEncoder().encode(message);

        const signResult = await wallet.signMessages({
          addresses: [addressUint8],
          payloads: [messageUint8],
        });

        // Convert signature to base64 for transport
        const signatureUint8 = signResult.signatures[0];
        signature = Buffer.from(signatureUint8).toString("base64");
      });

      console.log("Connected wallet address (Base58):", newWalletAddress);
      setWalletAddress(newWalletAddress);

      // Store wallet address in user metadata if we have a session
      if (session?.user && newWalletAddress) {
        // 1. Call Edge Function to safely update profile (with signature verification)
        const { data, error } = await supabase.functions.invoke('rewards-manager', {
          body: {
            action: 'update_wallet_address',
            wallet_address: newWalletAddress,
            message: message,
            signature: signature
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
        setWalletAddress(null);
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
    walletAddress,
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
