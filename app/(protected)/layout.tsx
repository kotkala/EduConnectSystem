import { requireAuth } from "@/lib/auth";
import { hasEnvVars } from "@/lib/constants";
import { MainLayout } from "@/components/layout/main-layout";
import type { WithChildren } from "@/lib/types";

/**
 * Protected layout - only accessible to authenticated users
 */
export default async function ProtectedLayout({ children }: WithChildren) {
  // Only check auth if environment variables are available (not during build)
  if (hasEnvVars) {
    await requireAuth();
  }

  return <MainLayout>{children}</MainLayout>;
}
