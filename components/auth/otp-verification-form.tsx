"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { otpVerificationSchema, type OtpVerificationFormData } from "@/lib/validations";
import { Icons } from "@/components/ui/icons";

type OtpVerificationFormProps = React.ComponentPropsWithoutRef<"div">;

export function OtpVerificationForm({ className, ...props }: OtpVerificationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [formData, setFormData] = useState<OtpVerificationFormData>({
    email: email,
    token: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form data
      const validatedData = otpVerificationSchema.parse(formData);

      const { user, session, error } = await authClient.verifyOtp(validatedData);

      if (error) {
        setError(error);
        return;
      }

      if (user && session) {
        router.push(ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      if (error.errors) {
        setError(error.errors[0]?.message || "Validation error");
      } else {
        setError(error instanceof Error ? error.message : "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      const { error } = await authClient.resendOtp(email);

      if (error) {
        setError(error);
        return;
      }

      setCountdown(60); // 60 second cooldown
    } catch (error: any) {
      setError(error instanceof Error ? error.message : "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6); // Only digits, max 6
    setFormData(prev => ({ ...prev, token: value }));
    if (error) setError(null);
  };

  if (!email) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Request</CardTitle>
            <CardDescription>
              No email provided. Please start the authentication process again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(ROUTES.LOGIN)} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Verify Access Code</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="token">Access Code</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="123456"
                  required
                  value={formData.token}
                  onChange={handleTokenChange}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || formData.token.length !== 6}>
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Access Code"
                )}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isResending}
                  className="text-sm"
                >
                  {isResending ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend Code in ${countdown}s`
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
