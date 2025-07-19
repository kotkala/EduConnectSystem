import { LoginForm } from "@/components/auth/login-form";

// Force dynamic rendering for authentication pages
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm />;
}
