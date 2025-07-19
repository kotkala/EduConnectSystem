import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { otpVerificationSchema } from "@/lib/validations";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = otpVerificationSchema.parse(body);
    
    const supabase = await createClient();
    
    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email: validatedData.email,
      token: validatedData.token,
      type: 'email',
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.AUTH.OTP_VERIFIED,
      user: data.user,
      session: data.session,
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
