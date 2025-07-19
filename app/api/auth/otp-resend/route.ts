import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resendOtpSchema } from "@/lib/validations";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = resendOtpSchema.parse(body);
    
    const supabase = await createClient();
    
    // Resend OTP
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: validatedData.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.AUTH.OTP_RESENT,
    });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error", success: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC, success: false },
      { status: 500 }
    );
  }
}
