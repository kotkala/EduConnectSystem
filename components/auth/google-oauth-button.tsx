"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Icons } from "@/components/ui/icons";

interface GoogleOAuthButtonProps {
  className?: string;
  disabled?: boolean;
}

export function GoogleOAuthButton({ className, disabled }: GoogleOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await authClient.signInWithGoogle();

      if (error) {
        console.error("Google OAuth error:", error);
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error("Google OAuth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icons.google className="mr-2 h-4 w-4" />
      )}
Sign in with Google
    </Button>
  );
}
