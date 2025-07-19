"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleOAuthButton } from "./google-oauth-button";
import { EmailOtpForm } from "./email-otp-form";

/**
 * LoginForm component props
 */
type LoginFormProps = React.ComponentPropsWithoutRef<"div">;

/**
 * LoginForm component for user authentication
 */
export function LoginForm({ className, ...props }: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">EduConnect Login</CardTitle>
          <CardDescription>
            Access your educational dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Google OAuth Button */}
            <GoogleOAuthButton className="w-full" />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email OTP Form */}
            <EmailOtpForm />

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Contact your administrator for account access
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
