import { requireAuth } from "@/lib/auth";
import { hasEnvVars } from "@/lib/constants";
import { InfoIcon } from "lucide-react";

// Force dynamic rendering for protected pages
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Only check auth if environment variables are available (not during build)
  const user = hasEnvVars ? await requireAuth() : { id: 'build-user', email: 'build@example.com' };

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected dashboard page, only accessible when logged in.
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">User Information</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
