"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/**
 * LogoutButton component that handles user logout
 * @returns JSX element with a logout button that clears the session and redirects to login
 */
export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.LOGIN);
  };

  return (
    <Button onClick={logout} size="sm" variant="outline">
      Logout
    </Button>
  );
}
