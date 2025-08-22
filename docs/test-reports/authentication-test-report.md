# EduConnect Authentication Test Report

## Test Summary
| Feature | Authentication |
|---------|----------------|
| Test requirement | Login, OTP Authentication, Password Reset |
| Number of TCs | 20 |
| Testing Round | Passed | Failed | Pending | N/A |
| Round 1 | 18 | 2 | 0 | 0 |
| Round 2 | 20 | 0 | 0 | 0 |
| Round 3 | 20 | 0 | 0 | 0 |

## Test Environment
- **Application URL**: http://localhost:3000
- **Database**: Supabase PostgreSQL
- **Email Service**: Gmail SMTP (dinhquoctien1980@gmail.com)
- **Test Date Range**: 22/08/2025 - 25/08/2025
- **Browser**: Chrome 131.x, Firefox 133.x, Edge 131.x

## Test Cases

### Login Authentication

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Test Data | Round 1 | Test Date | Tester | Round 2 | Test Date | Tester | Round 3 | Test Date | Tester | Note |
|--------------|----------------------|-------------------|------------------|----------------|-----------|---------|-----------|--------|---------|-----------|--------|---------|-----------|--------|------|
| **LO_1** | Test UI layout of login screen | 1. Navigate to http://localhost:3000<br>2. Observe layout, alignment, and design elements | The system displays login form:<br>- EduConnect logo<br>- Email input field<br>- Password input field<br>- "Đăng nhập" button<br>- "Quên mật khẩu?" link<br>- Google OAuth button | None | None | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | UI responsive on all devices |
| **LO_2** | Test login with valid Admin credentials | 1. Open login page<br>2. Enter Admin email and password<br>3. Click "Đăng nhập" | System logs in successfully and redirects to Admin dashboard at /dashboard/admin | Admin account exists in system | Email: "admin@educonnect.vn"<br>Password: "Admin123!" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Dashboard loads correctly |
| **LO_3** | Test login with valid Teacher credentials | 1. Open login page<br>2. Enter Teacher email and password<br>3. Click "Đăng nhập" | System logs in successfully and redirects to Teacher dashboard at /dashboard/teacher | Teacher account exists in system | Email: "teacher@educonnect.vn"<br>Password: "Teacher123!" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Homeroom class data loaded |
| **LO_4** | Test login with valid Student credentials | 1. Open login page<br>2. Enter Student email and password<br>3. Click "Đăng nhập" | System logs in successfully and redirects to Student dashboard at /student | Student account exists in system | Email: "student@educonnect.vn"<br>Password: "Student123!" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Grade data accessible |
| **LO_5** | Test login with valid Parent credentials | 1. Open login page<br>2. Enter Parent email and password<br>3. Click "Đăng nhập" | System logs in successfully and redirects to Parent dashboard at /dashboard/parent | Parent account exists in system | Email: "parent@educonnect.vn"<br>Password: "Parent123!" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Child data visible |
| **LO_6** | Test login with empty email field | 1. Open login page<br>2. Leave email empty, enter password<br>3. Click "Đăng nhập" | System displays validation error: "Email is required" and highlights email field | None | Email: ""<br>Password: "123456" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Form validation working |
| **LO_7** | Test login with empty password field | 1. Open login page<br>2. Enter email, leave password empty<br>3. Click "Đăng nhập" | System displays validation error: "Password is required" and highlights password field | None | Email: "test@educonnect.vn"<br>Password: "" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Form validation working |
| **LO_8** | Test login with both fields empty | 1. Open login page<br>2. Leave both email and password empty<br>3. Click "Đăng nhập" | System displays validation errors for both fields and prevents form submission | None | Email: ""<br>Password: "" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Multiple validation errors shown |
| **LO_9** | Test login with invalid email format | 1. Open login page<br>2. Enter invalid email format<br>3. Enter valid password<br>4. Click "Đăng nhập" | System displays validation error: "Please enter a valid email address" | None | Email: "invalid-email"<br>Password: "123456" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Email format validation |
| **LO_10** | Test login with non-existent email | 1. Open login page<br>2. Enter non-existent email<br>3. Enter any password<br>4. Click "Đăng nhập" | System displays error: "Invalid login credentials" | None | Email: "nonexistent@test.com"<br>Password: "123456" | Failed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Fixed error message display |
| **LO_11** | Test login with correct email but wrong password | 1. Open login page<br>2. Enter valid email<br>3. Enter incorrect password<br>4. Click "Đăng nhập" | System displays error: "Invalid login credentials" | Valid user account exists | Email: "admin@educonnect.vn"<br>Password: "wrongpassword" | Failed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Security message consistent |

### Google OAuth Authentication

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Test Data | Round 1 | Test Date | Tester | Round 2 | Test Date | Tester | Round 3 | Test Date | Tester | Note |
|--------------|----------------------|-------------------|------------------|----------------|-----------|---------|-----------|--------|---------|-----------|--------|---------|-----------|--------|------|
| **GO_1** | Test Google OAuth button visibility | 1. Open login page<br>2. Observe Google OAuth button | Google OAuth button is visible with proper styling and Google logo | None | None | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Button properly styled |
| **GO_2** | Test Google OAuth login flow | 1. Open login page<br>2. Click "Continue with Google"<br>3. Complete Google authentication | System redirects to Google OAuth, then back to appropriate dashboard based on user role | Google account exists | Google Account: "test@gmail.com" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | OAuth flow working |
| **GO_3** | Test Google OAuth with new user | 1. Open login page<br>2. Click "Continue with Google"<br>3. Use Google account not in system | System creates new user account and redirects to profile completion | New Google account | Google Account: "newuser@gmail.com" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Profile setup required |

### Password Reset (OTP)

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Test Data | Round 1 | Test Date | Tester | Round 2 | Test Date | Tester | Round 3 | Test Date | Tester | Note |
|--------------|----------------------|-------------------|------------------|----------------|-----------|---------|-----------|--------|---------|-----------|--------|---------|-----------|--------|------|
| **PR_1** | Test "Forgot Password" link functionality | 1. Open login page<br>2. Click "Quên mật khẩu?" link | System redirects to password reset page with email input field | None | None | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Navigation working |
| **PR_2** | Test OTP request with valid email | 1. Go to password reset page<br>2. Enter valid registered email<br>3. Click "Gửi mã OTP" | System sends 6-digit OTP to email and shows OTP input field | Valid user email exists | Email: "admin@educonnect.vn" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | OTP received via Gmail |
| **PR_3** | Test OTP request with invalid email | 1. Go to password reset page<br>2. Enter non-existent email<br>3. Click "Gửi mã OTP" | System displays error: "Email not found in system" | None | Email: "notfound@test.com" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Error handling correct |
| **PR_4** | Test OTP verification with correct code | 1. Request OTP for valid email<br>2. Enter correct 6-digit OTP<br>3. Click "Xác nhận" | System accepts OTP and shows password reset form | OTP sent to email | OTP: "123456" (from email) | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | OTP validation working |
| **PR_5** | Test OTP verification with incorrect code | 1. Request OTP for valid email<br>2. Enter incorrect 6-digit OTP<br>3. Click "Xác nhận" | System displays error: "Invalid OTP code" | OTP sent to email | OTP: "000000" (incorrect) | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Error message clear |
| **PR_6** | Test password reset with valid new password | 1. Complete OTP verification<br>2. Enter new password (meets requirements)<br>3. Confirm password<br>4. Click "Đặt lại mật khẩu" | System updates password and redirects to login with success message | Valid OTP verified | New Password: "NewPass123!"<br>Confirm: "NewPass123!" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Password updated successfully |
| **PR_7** | Test password reset with mismatched passwords | 1. Complete OTP verification<br>2. Enter new password<br>3. Enter different confirmation password<br>4. Click "Đặt lại mật khẩu" | System displays error: "Passwords do not match" | Valid OTP verified | New Password: "NewPass123!"<br>Confirm: "DifferentPass!" | Passed | 22/08/2025 | QA Team | Passed | 23/08/2025 | QA Team | Passed | 24/08/2025 | QA Team | Validation working |

## Test Results Summary

### Round 1 (22/08/2025)
- **Total Test Cases**: 20
- **Passed**: 18
- **Failed**: 2 (LO_10, LO_11)
- **Issues Found**: 
  - Error message not displaying properly for invalid credentials
  - Inconsistent error handling between different login failure scenarios

### Round 2 (23/08/2025)
- **Total Test Cases**: 20
- **Passed**: 20
- **Failed**: 0
- **Fixes Applied**:
  - Improved error message display in login form
  - Standardized error handling across all authentication scenarios
  - Enhanced form validation feedback

### Round 3 (24/08/2025)
- **Total Test Cases**: 20
- **Passed**: 20
- **Failed**: 0
- **Status**: All authentication features working as expected

## Known Issues & Limitations
1. **Email Delivery**: OTP emails may take 1-2 minutes to arrive during peak hours
2. **Session Management**: Users remain logged in for 24 hours by default
3. **Rate Limiting**: OTP requests limited to 5 per hour per email address

## Recommendations
1. Implement progressive delays for failed login attempts
2. Add CAPTCHA after 3 failed login attempts
3. Consider implementing 2FA for admin accounts
4. Add password strength indicator during reset process

## Test Environment Configuration
- **SMTP Server**: smtp.gmail.com:587
- **Email Service**: Gmail (dinhquoctien1980@gmail.com)
- **Database**: Supabase PostgreSQL
- **Authentication Provider**: Supabase Auth + Google OAuth
- **Frontend Framework**: Next.js 15 with App Router
- **UI Components**: Shadcn/UI with Tailwind CSS

---
**Report Generated**: 25/08/2025  
**Report Version**: 1.0  
**Next Review Date**: 01/09/2025
