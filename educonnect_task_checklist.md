# EduConnect - Task Checklist (Role-based Priority)

> **Hướng dẫn:**
> - Luôn ưu tiên hoàn thiện các chức năng quản trị (Admin, School Admin) trước, sau đó mới đến giáo viên, học sinh, phụ huynh.
> - Khi hoàn thành một chức năng, đánh dấu [x] và ghi (Completed) vào cuối dòng.
> - Checklist này đã được sắp xếp theo thứ tự ưu tiên triển khai thực tế. **Mỗi task đã được đánh số thứ tự ưu tiên.**

---

## A. Quản trị hệ thống (Admin, School Admin) - Ưu tiên cao nhất

### 1. Quản lý Năm học, Học kỳ, Khối lớp, Lớp học
- [ ] **(1)** API & UI: Tạo, sửa, xóa, xem năm học (`academic_years`)
- [ ] **(2)** API & UI: Tạo, sửa, xóa, xem học kỳ (`academic_terms`)
- [ ] **(3)** API & UI: Tạo, sửa, xóa, xem khối lớp (`grade_levels`)
- [ ] **(4)** API & UI: Tạo, sửa, xóa, xem lớp học (`classes`)
- [ ] **(5)** API & UI: Quản lý phân công giáo viên chủ nhiệm (`homeroom_assignments`)
- [ ] **(6)** API & UI: Quản lý phân công giáo viên bộ môn (`teaching_schedules`)

### 2. Quản lý Người dùng & Phân quyền
- [ ] **(7)** API & UI: Tạo, sửa, xóa, xem người dùng (Admin, Giáo viên, Học sinh, Phụ huynh)
- [ ] **(8)** API & UI: Quản lý quan hệ phụ huynh-học sinh (`parent_student_relationships`)
- [ ] **(9)** API & UI: Reset mật khẩu, khóa/mở tài khoản, phân quyền

### 3. Quản lý Môn học & Phân công môn học
- [ ] **(10)** API & UI: Tạo, sửa, xóa, xem môn học (`subjects`)
- [ ] **(11)** API & UI: Phân công môn học cho lớp/khối (`subject_assignments`)

### 4. Quản lý Chính sách, nhật ký hệ thống, cấu hình
- [ ] **(12)** API & UI: Quản lý chính sách nhà trường (`school_policies`)
- [ ] **(13)** API & UI: Xem nhật ký hệ thống (`audit_logs`)
- [ ] **(14)** API & UI: Quản lý tài liệu, upload/download (`documents`)

---

## B. Giáo viên (Homeroom/Subject Teacher) - Ưu tiên trung bình/cao

### 1. Quản lý Điểm danh & Xin nghỉ
- [ ] **(15)** API & UI: Ghi nhận điểm danh cho lớp mình phụ trách (`attendance_records`)
- [ ] **(16)** API & UI: Xem lịch sử điểm danh của lớp/học sinh
- [ ] **(17)** API & UI: Duyệt/xử lý yêu cầu xin nghỉ (`leave_requests`)

### 2. Quản lý Lịch dạy & Lịch thi
- [ ] **(18)** API & UI: Xem lịch dạy, lịch thi của mình
- [ ] **(19)** API & UI: Đề xuất thay đổi lịch dạy (nếu có)

### 3. Quản lý Điểm số & Phúc khảo
- [ ] **(20)** API & UI: Nhập điểm cho học sinh (`grade_records`)
- [ ] **(21)** API & UI: Xem điểm, sửa điểm (nếu được phân quyền)
- [ ] **(22)** API & UI: Duyệt yêu cầu phúc khảo điểm (`grade_reevaluation_requests`)

### 4. Quản lý Vi phạm & Kỷ luật
- [ ] **(23)** API & UI: Ghi nhận vi phạm học sinh (`student_violations`)
- [ ] **(24)** API & UI: Xử lý kỷ luật học sinh (`disciplinary_actions`)
- [ ] **(25)** API & UI: Xem lịch sử vi phạm, kỷ luật

### 5. Giao tiếp & Thông báo
- [ ] **(26)** API & UI: Gửi thông báo cho học sinh/phụ huynh (`notifications`)
- [ ] **(27)** API & UI: Tạo lịch họp phụ huynh (`meetings`)

---

## C. Học sinh & Phụ huynh - Ưu tiên sau cùng

### 1. Xem thông tin cá nhân & lớp học
- [ ] **(28)** API & UI: Xem thông tin cá nhân, lớp học, giáo viên chủ nhiệm

### 2. Xem lịch học, lịch thi, điểm danh
- [ ] **(29)** API & UI: Xem lịch học, lịch thi, lịch sử điểm danh

### 3. Xem điểm & gửi yêu cầu phúc khảo
- [ ] **(30)** API & UI: Xem điểm các môn, học kỳ
- [ ] **(31)** API & UI: Gửi yêu cầu phúc khảo điểm

### 4. Xin nghỉ học
- [ ] **(32)** API & UI: Gửi yêu cầu xin nghỉ học (`leave_requests`)
- [ ] **(33)** API & UI: Xem trạng thái yêu cầu xin nghỉ

### 5. Xem vi phạm, kỷ luật
- [ ] **(34)** API & UI: Xem lịch sử vi phạm, kỷ luật cá nhân

### 6. Nhận thông báo & tham gia họp
- [ ] **(35)** API & UI: Xem thông báo
- [ ] **(36)** API & UI: Xem lịch họp phụ huynh, xác nhận tham gia

---

## D. Testing & Documentation (Bắt buộc cho mọi vai trò)

- [ ] **(37)** Viết unit test cho các API chính (ưu tiên các chức năng quản trị, điểm danh, điểm số)
- [ ] **(38)** Viết integration test cho các luồng nghiệp vụ quan trọng
- [ ] **(39)** Viết tài liệu hướng dẫn sử dụng API và các chức năng

---

> **Ghi chú triển khai:**
> - Luôn phát triển các chức năng quản trị trước để đảm bảo dữ liệu nền tảng và phân quyền đã sẵn sàng cho các vai trò thấp hơn.
> - Sau khi hoàn thành chức năng nào, cập nhật trạng thái vào checklist này.
> - Có thể chia nhỏ từng task lớn thành các subtask nhỏ hơn nếu cần (ví dụ: API lấy danh sách, API thêm, API sửa, API xóa).
> - Luôn kiểm tra RLS, bảo mật, type safety, và test coverage trước khi đánh dấu hoàn thành. 