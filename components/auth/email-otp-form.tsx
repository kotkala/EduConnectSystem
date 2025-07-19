"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { emailOnlySchema, type EmailOnlyFormData } from "@/lib/validations";
import { Icons } from "@/components/ui/icons";

type EmailOtpFormProps = React.ComponentPropsWithoutRef<"div">;

export function EmailOtpForm({ className, ...props }: EmailOtpFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<EmailOnlyFormData>({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form data
      const validatedData = emailOnlySchema.parse(formData);

      const { error } = await authClient.sendOtp(validatedData);

      if (error) {
        setError(error);
        return;
      }

      setOtpSent(true);
      // Redirect to OTP verification page with email
      router.push(`${ROUTES.OTP_VERIFY}?email=${encodeURIComponent(validatedData.email)}`);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    if (error) setError(null);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Email Authentication</CardTitle>
          <CardDescription>
            Enter your institutional email to receive access code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              {otpSent && (
                <p className="text-sm text-green-600" role="alert">
                  OTP sent! Check your email and enter the code on the next page.
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Icons.mail className="mr-2 h-4 w-4" />
                    Send Access Code
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
