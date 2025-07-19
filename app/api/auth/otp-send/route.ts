import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailOnlySchema } from "@/lib/validations";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = emailOnlySchema.parse(body);
    
    const supabase = await createClient();
    
    // Send OTP to email
    const { error } = await supabase.auth.signInWithOtp({
      email: validatedData.email,
      options: {
        shouldCreateUser: true,
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
      message: SUCCESS_MESSAGES.AUTH.OTP_SENT,
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
