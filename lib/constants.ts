// Error messages for authentication
export const ERROR_MESSAGES = {
  GENERIC: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
  INVALID_EMAIL: 'Vui lòng nhập địa chỉ email hợp lệ.',
  INVALID_OTP: 'Mã OTP không hợp lệ. Vui lòng kiểm tra và thử lại.',
  OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản với địa chỉ email này.',
  PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ người dùng. Vui lòng hoàn tất thiết lập hồ sơ.',
  UNAUTHORIZED: 'Bạn không có quyền truy cập tài nguyên này.',
  NETWORK_ERROR: 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.',
  RATE_LIMITED: 'Quá nhiều yêu cầu. Vui lòng đợi một lúc và thử lại.',
  SIGNUP_DISABLED: 'Hiện tại đang tạm dừng đăng ký tài khoản mới.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_NOT_CONFIRMED: 'Vui lòng kiểm tra email và xác nhận tài khoản của bạn.',
  WEAK_PASSWORD: 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.',
  EMAIL_ALREADY_EXISTS: 'Đã tồn tại tài khoản với email này.',
  GOOGLE_AUTH_ERROR: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
  OTP_SEND_ERROR: 'Gửi mã OTP thất bại. Vui lòng thử lại.',
  PROFILE_UPDATE_ERROR: 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.',
  SESSION_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
} as const

// Route constants
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/dashboard/admin',
  TEACHER_DASHBOARD: '/dashboard/teacher',
  STUDENT_DASHBOARD: '/student',
  PARENT_DASHBOARD: '/dashboard/parent',
  AUTH_ERROR: '/auth/auth-code-error',
  CALLBACK: '/auth/callback',
  CONFIRM: '/auth/confirm',
} as const

// User role constants
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
} as const

// Authentication provider constants
export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  EMAIL: 'email',
} as const

// OTP configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  RESEND_COOLDOWN_SECONDS: 60,
} as const

// Validation constants
export const VALIDATION = {
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  OTP_REGEX: /^\d{6}$/,
} as const
