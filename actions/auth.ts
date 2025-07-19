"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants";
import {
  emailOnlySchema,
  otpVerificationSchema,
  resendOtpSchema,
  type EmailOnlyFormData,
  type OtpVerificationFormData,
  type ResendOtpFormData
} from "@/lib/validations";

// Server action for sending OTP
export async function sendOtpAction(formData: FormData) {
  try {
    const data: EmailOnlyFormData = {
      email: formData.get("email") as string,
    };

    // Validate form data
    const validatedData = emailOnlySchema.parse(data);

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: validatedData.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}${ROUTES.DASHBOARD}`,
      },
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      success: true,
      message: SUCCESS_MESSAGES.AUTH.OTP_SENT,
    };
  } catch (error: any) {
    return {
      error: error.errors?.[0]?.message || ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
}

// Server action for verifying OTP
export async function verifyOtpAction(formData: FormData) {
  try {
    const data: OtpVerificationFormData = {
      email: formData.get("email") as string,
      token: formData.get("token") as string,
    };

    // Validate form data
    const validatedData = otpVerificationSchema.parse(data);

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: validatedData.email,
      token: validatedData.token,
      type: 'email',
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      success: true,
      message: SUCCESS_MESSAGES.AUTH.OTP_VERIFIED,
    };
  } catch (error: any) {
    return {
      error: error.errors?.[0]?.message || ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
}

// Server action for logout
export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    
    redirect(ROUTES.LOGIN);
  } catch (error) {
    return {
      error: ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
}

// Server action for resending OTP
export async function resendOtpAction(formData: FormData) {
  try {
    const data: ResendOtpFormData = {
      email: formData.get("email") as string,
    };

    // Validate form data
    const validatedData = resendOtpSchema.parse(data);

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: validatedData.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}${ROUTES.DASHBOARD}`,
      },
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      success: true,
      message: SUCCESS_MESSAGES.AUTH.OTP_RESENT,
    };
  } catch (error: any) {
    return {
      error: error.errors?.[0]?.message || ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
}

// Server action for Google OAuth
export async function googleOAuthAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}${ROUTES.DASHBOARD}`,
      },
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    // For OAuth, we need to redirect to the provider URL
    if (data.url) {
      redirect(data.url);
    }

    return {
      success: true,
      message: SUCCESS_MESSAGES.AUTH.OAUTH_SUCCESS,
    };
  } catch (error: any) {
    return {
      error: error.message || ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
}
