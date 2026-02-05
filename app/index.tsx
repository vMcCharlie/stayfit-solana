import { Redirect } from "expo-router";
import { useAuth } from "../src/context/auth";

// Redirect to the intro screen when the app starts
export default function Index() {
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard, otherwise to intro
  return <Redirect href={user ? "/(tabs)" : "/intro"} />;
}
