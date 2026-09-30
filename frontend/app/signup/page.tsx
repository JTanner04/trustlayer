import type { Metadata } from "next";
import AuthScreen from "../components/auth-screen";

export const metadata: Metadata = { title: "Sign up | TrustLayer" };

export default function SignupPage() {
  return <AuthScreen mode="signup" />;
}
