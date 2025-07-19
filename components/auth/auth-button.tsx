"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { authClient } from "@/lib/auth-client";
import { LogoutButton } from "./logout-button";
import { ROUTES } from "@/lib/constants";
import type { AuthUser } from "@/lib/types";

/**
 * AuthButton component that displays different UI based on user authentication status
 * @returns JSX element with login button for unauthenticated users or user info with logout for authenticated users
 */
export function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authClient.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = authClient.onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" disabled>
          Loading...
        </Button>
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-foreground">
        Hey, {user.email}!
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="default">
        <Link href={ROUTES.LOGIN}>Sign in</Link>
      </Button>
    </div>
  );
}
