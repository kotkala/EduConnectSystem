import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon, User, Shield, Database } from "lucide-react";
import { EduConnectAnimatedContainer, EduConnectAnimatedCard } from "@/components/ui/animated-components";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <EduConnectAnimatedContainer variant="slideUp" delay={0.1}>
        <div className="w-full">
          <EduConnectAnimatedCard 
            variant="premium" 
            hover="lift" 
            className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/20 dark:to-blue-950/20 border-teal-200 dark:border-teal-800"
          >
            <div className="p-6">
              <div className="flex gap-3 items-center text-teal-700 dark:text-teal-300">
                <Shield size="20" strokeWidth={2} />
                <div>
                  <h3 className="font-semibold text-lg">Protected Area</h3>
                  <p className="text-sm text-muted-foreground">
                    Only authenticated users can access this page
                  </p>
                </div>
              </div>
            </div>
          </EduConnectAnimatedCard>
        </div>
      </EduConnectAnimatedContainer>

      <EduConnectAnimatedContainer variant="slideUp" delay={0.2}>
        <div className="grid md:grid-cols-2 gap-6">
          <EduConnectAnimatedCard 
            variant="premium" 
            hover="lift" 
            className="h-full"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h2 className="font-bold text-xl">User Information</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Email:</span>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {data.user.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">ID:</span>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {data.user.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Created:</span>
                  <span className="text-sm">
                    {new Date(data.user.created_at).toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          </EduConnectAnimatedCard>

          <EduConnectAnimatedCard 
            variant="premium" 
            hover="lift" 
            className="h-full"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <h2 className="font-bold text-xl">Raw Data</h2>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-xs font-mono text-muted-foreground">
                  {JSON.stringify(data.user, null, 2)}
                </pre>
              </div>
            </div>
          </EduConnectAnimatedCard>
        </div>
      </EduConnectAnimatedContainer>

      <EduConnectAnimatedContainer variant="slideUp" delay={0.3}>
        <EduConnectAnimatedCard 
          variant="premium" 
          hover="lift" 
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800"
        >
          <div className="p-6">
            <div className="flex gap-3 items-center text-amber-700 dark:text-amber-300">
              <InfoIcon size="20" strokeWidth={2} />
              <div>
                <h3 className="font-semibold text-lg">Congratulations!</h3>
                <p className="text-sm text-muted-foreground">
                  You have successfully logged in and can access all EduConnect features
                </p>
              </div>
            </div>
          </div>
        </EduConnectAnimatedCard>
      </EduConnectAnimatedContainer>
    </div>
  );
}
