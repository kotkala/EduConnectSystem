import { requireGuest } from "@/lib/auth";
import { hasEnvVars } from "@/lib/constants";
import type { WithChildren } from "@/lib/types";

/**
 * Auth layout - only accessible to non-authenticated users
 */
export default async function AuthLayout({ children }: WithChildren) {
  // Only check auth if environment variables are available (not during build)
  if (hasEnvVars) {
    await requireGuest();
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
