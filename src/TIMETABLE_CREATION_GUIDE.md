# 📚 HƯỚNG DẪN TẠO THỜI KHÓA BIỂU - EDUCONNECT

## 🎯 Mục tiêu
Hướng dẫn chi tiết từng bước để tạo thời khóa biểu tự động và hiệu quả trong hệ thống EduConnect.

---

## 🔧 BƯỚC 1: CHUẨN BỊ DỮ LIỆU CƠ BẢN

### 1.1 Khởi tạo năm học và học kỳ
```
🎓 Dashboard → Admin → Academic Years
- Tạo năm học mới (VD: 2024-2025)
- Thiết lập học kỳ 1, học kỳ 2
- Đặt học kỳ hiện tại
```

### 1.2 Thiết lập khối lớp
```
📚 Dashboard → Admin → Grade Levels  
- Khối 6, 7, 8, 9 (THCS)
- Khối 10, 11, 12 (THPT)
- Thiết lập thứ tự ưu tiên
```

### 1.3 Tạo môn học
```
📖 Dashboard → Admin → Subjects
- Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa
- Thể dục, Âm nhạc, Mỹ thuật, Tin học
- Gán mã môn học (MA, VAN, ANH...)
```

### 1.4 Thiết lập thời gian học
```
⏰ Dashboard → Admin → Time Slots
- Tiết 1: 07:00 - 07:45
- Tiết 2: 07:55 - 08:40
- Nghỉ giải lao: 08:40 - 09:00
- Tiết 3: 09:00 - 09:45
- Tiết 4: 09:55 - 10:40
- Nghỉ trưa: 11:00 - 13:30
- Tiết 5: 13:30 - 14:15
- Tiết 6: 14:25 - 15:10
```

---

## 🏫 BƯỚC 2: TẠO LỚP HỌC VÀ PHÂN BỔ HỌC SINH

### 2.1 Tạo lớp học
```
🎒 Dashboard → Admin → Classes
- Tạo lớp theo khối: 6A, 6B, 7A, 7B...
- Thiết lập sức chứa: 35-40 học sinh/lớp
- Gán phòng học nếu có
```

### 2.2 Phân bổ chương trình giảng dạy
```
📋 Dashboard → Admin → Curriculum Distribution
- Chọn học kỳ
- Thiết lập số tiết/tuần cho mỗi môn:
  * Toán, Văn: 4-5 tiết/tuần
  * Anh, Lý, Hóa: 3-4 tiết/tuần
  * Các môn khác: 1-2 tiết/tuần
```

---

## 👨‍🏫 BƯỚC 3: PHÂN CÔNG GIÁO VIÊN

### 3.1 Tạo tài khoản giáo viên
```
👤 Dashboard → Admin → Users
- Thêm giáo viên với role: subject_teacher
- Gán chuyên môn (Toán, Văn, Anh...)
- Thiết lập thông tin liên hệ
```

### 3.2 Phân công giáo viên dạy môn
```
📝 Dashboard → Admin → Teacher Assignments
1. Nhấn "Phân công mới"
2. Chọn học kỳ hiện tại
3. Chọn giáo viên
4. Chọn lớp học
5. Chọn môn học
6. Thêm lịch dạy:
   - Thứ 2, Tiết 1: Toán 6A
   - Thứ 3, Tiết 2: Toán 6A
   - Thứ 5, Tiết 3: Toán 6A
   - Phòng học: A101
7. Nhấn "Phân công giáo viên"
```

**Lưu ý quan trọng**: Mỗi phân công cần có ít nhất 1 lịch dạy cụ thể!

---

## ⚙️ BƯỚC 4: THIẾT LẬP RÀNG BUỘC (TÙY CHỌN)

### 4.1 Ràng buộc giáo viên
```
🚫 Dashboard → Admin → Schedule Constraints
- Giáo viên không có mặt: Thứ 7 buổi sáng
- Thời gian ưu tiên: Ban giám hiệu dạy buổi sáng
- Tránh thời gian: Thể dục không tiết đầu/cuối
```

### 4.2 Ràng buộc môn học
```
📚 Ràng buộc môn học:
- Toán liên tiếp: 2 tiết Toán cùng buổi
- Thể dục không liên tiếp: Giãn cách ít nhất 1 tiết
- Âm nhạc buổi chiều: Phòng nhạc chung
```

### 4.3 Ràng buộc lớp học
```
🏫 Ràng buộc lớp:
- Sinh hoạt lớp: Thứ 2 tiết 1
- Chào cờ: Thứ 2 đầu tuần toàn trường
- Lớp không có mặt: Buổi chiều thứ 7
```

---

## 🚀 BƯỚC 5: TẠO THỜI KHÓA BIỂU TỰ ĐỘNG

### 5.1 Tạo thời khóa biểu
```
📅 Dashboard → Admin → Teaching Schedules
1. Nhấn "Tạo thời khóa biểu"
2. Chọn học kỳ
3. Chọn "Tự động tạo thời khóa biểu"
4. Hệ thống sẽ:
   ✅ Kiểm tra phân công giáo viên
   ✅ Áp dụng ràng buộc đã thiết lập
   ✅ Tự động sắp xếp lịch học
   ✅ Tránh xung đột thời gian
5. Xem kết quả và điều chỉnh nếu cần
```

### 5.2 Kiểm tra và điều chỉnh
```
🔍 Kiểm tra thời khóa biểu:
- Xem theo lớp: Kiểm tra đủ tiết/môn
- Xem theo giáo viên: Đảm bảo không quá tải
- Xem theo phòng: Tránh trùng lặp
- Kiểm tra ràng buộc: Đúng quy định
```

---

## 📋 BƯỚC 6: THEO DÕI VÀ BÁO CÁO

### 6.1 Thống kê thời khóa biểu
```
📊 System Overview:
- Tổng số tiết học: 450+ tiết/tuần
- Lớp có thời khóa biểu: 100%
- Giáo viên được phân công: 25+ người
- Tỷ lệ đạt ràng buộc: 95%+
```

### 6.2 Xuất báo cáo
```
📄 Xuất thời khóa biểu:
- Theo lớp: PDF cho mỗi lớp
- Theo giáo viên: Lịch cá nhân
- Tổng hợp: Báo cáo toàn trường
- Gửi email: Thông báo tự động
```

---

## ⚠️ LỖI THƯỜNG GẶP VÀ CÁCH KHẮC PHỤC

### Lỗi 1: "academic_term_id, teacher_id, class_id, subject_id, and schedules array are required"
**Nguyên nhân**: Thiếu thông tin lịch dạy cụ thể
**Khắc phục**: 
- Đảm bảo chọn đầy đủ: học kỳ, giáo viên, lớp, môn học
- Thêm ít nhất 1 lịch dạy với thứ và tiết cụ thể

### Lỗi 2: "Column time_slots.is_active does not exist"
**Nguyên nhân**: Cơ sở dữ liệu chưa được cập nhật
**Khắc phục**: Chạy migration script đã sửa

### Lỗi 3: "Select.Item must have a value prop that is not an empty string"
**Nguyên nhân**: Form có option rỗng
**Khắc phục**: Đã sửa trong code, không hiển thị option "Tất cả"

---

## 🎯 TIPS ĐỂ TẠO THỜI KHÓA BIỂU HIỆU QUẢ

### 1. Chuẩn bị kỹ dữ liệu
- ✅ Hoàn thành đầy đủ phân công giáo viên TRƯỚC khi tạo TKB
- ✅ Thiết lập ràng buộc hợp lý, không quá nhiều
- ✅ Kiểm tra thông tin giáo viên và lớp học

### 2. Phân công thông minh
- 📚 Môn chính (Toán, Văn): Buổi sáng, tập trung cao
- 🎨 Môn phụ (Âm nhạc, Mỹ thuật): Buổi chiều
- 🏃 Thể dục: Tránh tiết đầu/cuối, phân bổ đều

### 3. Tối ưu hóa ràng buộc
- ⚖️ Cân bằng giữa linh hoạt và ràng buộc
- 🔄 Ưu tiên ràng buộc "Cao" cho yêu cầu bắt buộc
- 📊 Theo dõi tỷ lệ vi phạm ràng buộc

### 4. Kiểm tra chất lượng
- 👀 Xem thời khóa biểu từ góc độ học sinh
- 👨‍🏫 Kiểm tra tải công việc giáo viên
- 🏫 Đảm bảo sử dụng hiệu quả phòng học

---

## 🚀 QUY TRÌNH NHANH (5 BƯỚC)

```
1️⃣ KHỞI TẠO: Năm học → Học kỳ → Khối lớp → Môn học → Tiết học

2️⃣ TẠO LỚP: Lớp học → Phân bổ chương trình

3️⃣ PHÂN CÔNG: Giáo viên → Phân công dạy môn (có lịch cụ thể)

4️⃣ RÀNG BUỘC: Thiết lập ràng buộc cần thiết

5️⃣ TẠO TKB: Tự động tạo → Kiểm tra → Hoàn thành
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra log lỗi trong browser console
2. Đảm bảo đã chạy migration script
3. Kiểm tra phân công giáo viên có đầy đủ lịch dạy
4. Liên hệ support với thông tin chi tiết lỗi

**Chúc bạn tạo thời khóa biểu thành công! 🎉** 

# 📚 Hướng dẫn tạo Lớp Ghép (Combined Classes)

## 🎯 Tổng quan

Hệ thống EduConnect sử dụng mô hình **Lớp Tách - Lớp Ghép** để tối ưu hóa việc học tập:

- **Lớp Tách (Base Class)**: Học sinh học các môn bắt buộc
- **Lớp Ghép (Combined Class)**: Học sinh học các môn tự chọn theo tổ hợp

## 🔄 Quy trình tạo Lớp Ghép

### **Bước 1: Tạo Lớp Tách**
1. Vào **Quản lý Lớp học** → **Thêm lớp**
2. Tạo các lớp tách (10A1, 10A2, 10A3...)
3. Thêm học sinh vào các lớp tách

### **Bước 2: Chọn Tổ hợp môn cho Học sinh**
1. Trong bảng **Quản lý Lớp học**, tìm lớp tách
2. Nhấn nút **📚 Chọn tổ hợp môn** (Subject Group Selection)
3. Chọn tổ hợp môn cho từng học sinh:
   - **KHTN1**: Khoa học tự nhiên 1 (Lý-Hóa-Sinh-Tin)
   - **KHTN2**: Khoa học tự nhiên 2 (Lý-Hóa-Sinh-Công nghệ)
   - **KHXH1**: Khoa học xã hội 1 (Địa-GDKT-PL-Lý-Công nghệ)
   - **KHXH2**: Khoa học xã hội 2 (Sử-Địa-GDKT-PL-Anh)
   - **KHXH3**: Khoa học xã hội 3 (Văn-Sử-Địa-Anh)

### **Bước 3: Tạo Lớp Ghép**
1. Nhấn nút **🔄 Tạo lớp ghép** (Create Combined Classes)
2. Chọn **Năm học** và **Khối lớp**
3. Xem **Thống kê học sinh** - kiểm tra số lượng học sinh đã chọn tổ hợp
4. Chọn **Tổ hợp môn** cụ thể
5. Cấu hình **Sĩ số tối đa** mỗi lớp ghép
6. Nhấn **Tạo lớp ghép**

## ⚠️ Lưu ý quan trọng

### **Điều kiện tạo Lớp Ghép**
- ✅ Học sinh phải đã được thêm vào lớp tách
- ✅ Học sinh phải đã chọn tổ hợp môn
- ✅ Chỉ học sinh ở lớp tách (không phải lớp ghép) mới được ghép

### **Lỗi thường gặp**
1. **"Không lấy nhóm học sinh được"**
   - **Nguyên nhân**: Học sinh chưa chọn tổ hợp môn
   - **Giải pháp**: Sử dụng nút "Chọn tổ hợp môn" trong bảng lớp học

2. **"Không có học sinh nào chọn tổ hợp môn này"**
   - **Nguyên nhân**: Chưa có học sinh nào chọn tổ hợp môn được chọn
   - **Giải pháp**: Kiểm tra thống kê và chọn tổ hợp môn có học sinh

3. **"Lớp ghép không hiển thị"**
   - **Nguyên nhân**: Lỗi cache hoặc filter
   - **Giải pháp**: Nhấn nút "🔄 Refresh" hoặc reset filter

## 📊 Ví dụ thực tế

### **Trường hợp: Khối 10 có 90 học sinh**

**Lớp Tách:**
- 10A1: 30 học sinh
- 10A2: 30 học sinh  
- 10A3: 30 học sinh

**Chọn tổ hợp môn:**
- KHTN1: 40 học sinh (từ 10A1, 10A2, 10A3)
- KHTN2: 20 học sinh (từ 10A1, 10A2, 10A3)
- KHXH1: 30 học sinh (từ 10A1, 10A2, 10A3)

**Lớp Ghép được tạo:**
- KHTN1-10-1: 35 học sinh
- KHTN1-10-2: 5 học sinh
- KHTN2-10-1: 20 học sinh
- KHXH1-10-1: 30 học sinh

## 🕐 Lịch học mẫu

### **Học sinh Nguyễn Văn A (Lớp 10A1, chọn KHTN1)**

| Tiết | Thứ 2 | Thứ 3 | Thứ 4 | Thứ 5 | Thứ 6 |
|------|--------|--------|--------|--------|--------|
| 1-2 | **Toán** (10A1) | **Lý** (KHTN1-10-1) | **Văn** (10A1) | **Hóa** (KHTN1-10-1) | **Anh** (10A1) |
| 3-4 | **Văn** (10A1) | **Sinh** (KHTN1-10-1) | **Toán** (10A1) | **Tin** (KHTN1-10-1) | **Sử** (10A1) |
| 5-6 | **GDTC** (10A1) | **Anh** (10A1) | **GDQP** (10A1) | **GDĐP** (10A1) | **HĐTN** (10A1) |

**Giải thích:**
- **Môn bắt buộc**: Học với lớp tách 10A1
- **Môn tự chọn**: Học với lớp ghép KHTN1-10-1

## 🛠️ Khắc phục sự cố

### **Nếu không thể tạo lớp ghép:**

1. **Kiểm tra dữ liệu học sinh**
   ```
   - Vào Quản lý Lớp học
   - Chọn lớp tách
   - Nhấn "Chọn tổ hợp môn"
   - Kiểm tra xem học sinh đã chọn tổ hợp môn chưa
   ```

2. **Kiểm tra thống kê trong modal tạo lớp ghép**
   ```
   - Nhấn "Tạo lớp ghép"
   - Chọn năm học và khối lớp
   - Xem phần "Thống kê học sinh"
   - Kiểm tra "Đã chọn tổ hợp" > 0
   ```

3. **Debug qua API (dành cho developer)**
   ```bash
   GET /api/classes/create-combined?academic_year_id=xxx&grade_level_id=yyy
   ```

## 📱 Giao diện người dùng

### **Bảng Quản lý Lớp học**
- **Thêm lớp**: Tạo lớp tách
- **👥 Thêm học sinh**: Import học sinh vào lớp
- **📚 Chọn tổ hợp môn**: Chọn tổ hợp cho học sinh
- **🔄 Tạo lớp ghép**: Tạo lớp ghép từ tổ hợp môn
- **🔄 Refresh**: Làm mới danh sách

### **Modal Tạo lớp ghép**
- **Hướng dẫn**: Các bước thực hiện
- **Cấu hình**: Chọn năm học, khối, tổ hợp môn
- **Thống kê học sinh**: Xem phân bố tổ hợp môn
- **Chi tiết tổ hợp**: Thông tin môn học trong tổ hợp

## 🎓 Tóm tắt

1. **Tạo lớp tách** → **Thêm học sinh** → **Chọn tổ hợp môn** → **Tạo lớp ghép**
2. Đảm bảo học sinh đã chọn tổ hợp môn trước khi tạo lớp ghép
3. Sử dụng thống kê để kiểm tra dữ liệu trước khi tạo
4. Lớp ghép sẽ tự động nhóm học sinh có cùng tổ hợp môn

---

**📞 Hỗ trợ**: Nếu gặp vấn đề, vui lòng kiểm tra lại các bước trên hoặc liên hệ admin hệ thống. 