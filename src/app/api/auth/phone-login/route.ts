import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../lib/supabase/server';

const phoneLoginSchema = z.object({
  phone: z.string().min(8),
  password: z.string().min(8),
  otp: z.string().optional(),
});

// In-memory store for demo (should use Redis or DB in production)
const failedAttempts: Record<string, { count: number; last: number; lockedUntil?: number }> = {};
const OTP_REQUIRED_AFTER = 5;
const LOCKOUT_AFTER = 10;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 phút

function isValidPhone(phone: string) {
  return /^0\d{9}$/.test(phone);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const parse = phoneLoginSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }
    const { phone, password, otp } = parse.data;
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 });
    }
    
    // Check lockout
    const now = Date.now();
    const fail = failedAttempts[phone];
    if (fail && fail.lockedUntil && now < fail.lockedUntil) {
      return NextResponse.json({ error: 'Tài khoản bị khóa tạm thời. Vui lòng thử lại sau.' }, { status: 423 });
    }
    
    // Nếu đã sai >= OTP_REQUIRED_AFTER lần, yêu cầu OTP
    if (fail && fail.count >= OTP_REQUIRED_AFTER && !otp) {
      return NextResponse.json({ error: 'Yêu cầu xác minh OTP do đăng nhập sai nhiều lần.', otpRequired: true }, { status: 401 });
    }
    
    // TODO: Validate OTP nếu cần (tích hợp SMS provider thực tế)
    
    // Query user từ database bằng phone
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'active')
      .single();
    
    if (userError || !user) {
      // Lưu log đăng nhập sai
      failedAttempts[phone] = fail
        ? { count: fail.count + 1, last: now, lockedUntil: fail.count + 1 >= LOCKOUT_AFTER ? now + LOCKOUT_DURATION : undefined }
        : { count: 1, last: now };
      
      if (failedAttempts[phone].lockedUntil) {
        return NextResponse.json({ error: 'Tài khoản bị khóa tạm thời do đăng nhập sai quá nhiều lần.' }, { status: 423 });
      }
      return NextResponse.json({ error: 'Số điện thoại hoặc mật khẩu không đúng.' }, { status: 401 });
    }
    
    // Verify password with auth.users table
    const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
      email: `${phone}@educonnect.local`, // Tạo email giả từ phone để dùng với Supabase auth
      password: password
    });
    
    if (authError) {
      // Lưu log đăng nhập sai
      failedAttempts[phone] = fail
        ? { count: fail.count + 1, last: now, lockedUntil: fail.count + 1 >= LOCKOUT_AFTER ? now + LOCKOUT_DURATION : undefined }
        : { count: 1, last: now };
      
      if (failedAttempts[phone].lockedUntil) {
        return NextResponse.json({ error: 'Tài khoản bị khóa tạm thời do đăng nhập sai quá nhiều lần.' }, { status: 423 });
      }
      return NextResponse.json({ error: 'Số điện thoại hoặc mật khẩu không đúng.' }, { status: 401 });
    }
    
    // Đăng nhập thành công, reset failedAttempts
    delete failedAttempts[phone];
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);
    
    // TODO: Lưu log đăng nhập thành công vào audit_logs
    
    return NextResponse.json({ 
      success: true,
      session: authUser.session, 
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Lỗi server khi xử lý đăng nhập:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ. Vui lòng thử lại sau.' }, { status: 500 });
  }
} 