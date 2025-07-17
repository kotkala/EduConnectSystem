# 📊 HƯỚNG DẪN IMPORT THỜI KHÓA BIỂU BẰNG EXCEL - EDUCONNECT

## 🎯 Tổng quan

Tính năng Import thời khóa biểu bằng Excel cho phép bạn tạo thời khóa biểu một cách nhanh chóng và linh hoạt bằng cách sử dụng file Excel với các dropdown để chọn giáo viên.

---

## 🔧 CÁCH SỬ DỤNG

### Bước 1: Mở Modal Import
```
📅 Dashboard → Admin → Teaching Schedules → Import Excel
```

### Bước 2: Cấu hình thông tin
- **Năm học**: Chọn năm học cần tạo thời khóa biểu
- **Học kỳ**: Chọn học kỳ (Học kỳ 1: 18 tuần, Học kỳ 2: 17 tuần)
- **Tuần học**: Chọn tuần cần tạo thời khóa biểu (1-18/17)
- **Loại lớp**: 
  - **Tất cả lớp**: Bao gồm cả lớp tách và lớp ghép
  - **Lớp tách**: Chỉ lớp học thường (không phải lớp ghép môn)
  - **Lớp ghép**: Chỉ lớp ghép môn tự chọn
- **Lớp cụ thể**: Tùy chọn chọn một lớp cụ thể
- **Thay thế hiện có**: Checkbox để xóa thời khóa biểu cũ

### Bước 3: Tải file mẫu Excel
- Nhấn "Tải xuống file mẫu"
- File Excel sẽ được tạo với:
  - **Sheet chính**: Tổng quan thời khóa biểu
  - **Sheet từng lớp**: Chi tiết cho mỗi lớp
  - **Sheet tham chiếu**: Danh sách giáo viên, môn học, khung giờ
  - **Sheet hướng dẫn**: Cách sử dụng chi tiết

### Bước 4: Điền thông tin vào Excel
- Mở file Excel đã tải
- Vào sheet của từng lớp
- **Chọn giáo viên từ dropdown** trong mỗi ô thời khóa biểu
- **Format**: `[Tên giáo viên] - [Môn học] - [Phòng học]`
- **Ví dụ**: `Nguyễn Văn A - Toán - A101`

### Bước 5: Upload file đã hoàn thành
- Lưu file Excel
- Quay lại hệ thống, chọn "Đã tải xong"
- Upload file Excel đã điền đầy đủ
- Xem kết quả import

---

## 📋 CẤU TRÚC FILE EXCEL

### 1. Sheet chính (Timetable)
- Tổng quan thời khóa biểu toàn trường
- Hiển thị khung giờ học cơ bản

### 2. Sheet từng lớp (Tên lớp)
```
📊 Thông tin lớp:
- Tên lớp: 10A1
- Khối: Khối 10
- Loại lớp: Lớp tách/Lớp ghép
- Năm học: 2024-2025
- Học kỳ: Học kỳ 1
- Tuần: 1

📅 Thời khóa biểu:
| Tiết học | Thứ 2 | Thứ 3 | Thứ 4 | Thứ 5 | Thứ 6 | Thứ 7 |
|----------|--------|--------|--------|--------|--------|--------|
| Tiết 1   | Chào cờ| [Dropdown] | [Dropdown] | [Dropdown] | [Dropdown] | [Dropdown] |
| Tiết 2   | [Dropdown] | [Dropdown] | [Dropdown] | [Dropdown] | [Dropdown] | [Dropdown] |
| ...      | ...    | ...    | ...    | ...    | ...    | ...    |
| Tiết 10  | [Dropdown] | [Dropdown] | [Dropdown] | [Dropdown] | [Dropdown] | Sinh hoạt lớp |
```

### 3. Sheet tham chiếu
- **Danh sách giáo viên**: ID, Họ tên, Chuyên môn
- **Danh sách môn học**: ID, Mã môn, Tên môn, Tín chỉ
- **Khung giờ học**: ID, Tên tiết, Giờ bắt đầu, Giờ kết thúc

---

## 🎯 TÍNH NĂNG ĐẶC BIỆT

### 1. Dropdown thông minh
- **10 lớp với 10 dropdown** trong mỗi tiết học
- Dropdown chứa danh sách giáo viên với format: `Tên (ID)`
- Validation tự động khi chọn giáo viên

### 2. Tiết học đặc biệt
- **Tiết 1 Thứ 2**: Tự động đặt "Chào cờ" (không cần dropdown)
- **Tiết cuối Thứ 7**: Tự động đặt "Sinh hoạt lớp" (không cần dropdown)

### 3. Validation tự động
- Kiểm tra xung đột giáo viên
- Kiểm tra xung đột lớp học
- Kiểm tra phân công giáo viên
- Kiểm tra tồn tại môn học

### 4. Hỗ trợ lớp ghép
- Tự động nhận diện lớp ghép môn tự chọn
- Xử lý riêng cho từng loại lớp

---

## ⚙️ CÁC TÙय CHỌN NÂNG CAO

### 1. Số tuần học theo học kỳ
```
📅 Học kỳ 1: 18 tuần
📅 Học kỳ 2: 17 tuần  
📅 Học kỳ hè: 8 tuần
📅 Cả năm: 35 tuần
```

### 2. Loại lớp
```
🏫 Lớp tách: Lớp học thường cho môn bắt buộc
🔄 Lớp ghép: Lớp ghép môn tự chọn theo tổ hợp
📚 Tất cả: Bao gồm cả hai loại
```

### 3. Thay thế thời khóa biểu
- **Bật**: Xóa thời khóa biểu cũ trước khi import
- **Tắt**: Thêm vào thời khóa biểu hiện có

---

## 🔍 VALIDATION VÀ KIỂM TRA

### 1. Validation cơ bản
- ✅ File Excel đúng định dạng (.xlsx, .xls)
- ✅ Tên lớp tồn tại trong hệ thống
- ✅ Giáo viên có trong danh sách
- ✅ Môn học có trong danh sách

### 2. Validation nâng cao
- ✅ Giáo viên đã được phân công dạy môn cho lớp
- ✅ Không xung đột lịch giáo viên
- ✅ Không xung đột lịch lớp học
- ✅ Format dữ liệu đúng chuẩn

### 3. Báo cáo kết quả
```
📊 Thống kê import:
- Tổng lớp: 25
- Thành công: 23
- Thất bại: 2
- Tổng tiết học: 450
- Lỗi: 5
- Cảnh báo: 12
```

---

## 🚨 LỖI THƯỜNG GẶP VÀ CÁCH KHẮC PHỤC

### Lỗi 1: "Không tìm thấy lớp [Tên lớp]"
**Nguyên nhân**: Tên lớp trong Excel không khớp với tên trong hệ thống
**Khắc phục**: 
- Kiểm tra chính tả tên lớp
- Đảm bảo lớp đã được tạo trong hệ thống

### Lỗi 2: "Giáo viên đã có lịch dạy lớp khác vào thời gian này"
**Nguyên nhân**: Xung đột lịch giáo viên
**Khắc phục**:
- Kiểm tra lịch giáo viên trong thời khóa biểu hiện có
- Chọn giáo viên khác hoặc thay đổi thời gian

### Lỗi 3: "Lớp đã có tiết học với giáo viên khác vào thời gian này"
**Nguyên nhân**: Xung đột lịch lớp học
**Khắc phục**:
- Kiểm tra thời khóa biểu hiện có của lớp
- Chọn thời gian khác hoặc xóa tiết học trùng lặp

### Lỗi 4: "Không tìm thấy môn học [Tên môn]"
**Nguyên nhân**: Tên môn học không tồn tại
**Khắc phục**:
- Kiểm tra danh sách môn học trong sheet tham chiếu
- Sử dụng tên môn học chính xác

### Lỗi 5: "Giáo viên chưa được phân công dạy môn này cho lớp"
**Nguyên nhân**: Giáo viên chưa được phân công
**Khắc phục**:
- Vào "Teacher Assignments" để phân công giáo viên
- Hoặc chọn giáo viên khác đã được phân công

---

## 💡 TIPS SỬ DỤNG HIỆU QUẢ

### 1. Chuẩn bị trước khi import
- ✅ Đảm bảo đã tạo đầy đủ lớp học
- ✅ Phân công giáo viên dạy môn cho từng lớp
- ✅ Kiểm tra danh sách giáo viên và môn học
- ✅ Xác định rõ tuần cần tạo thời khóa biểu

### 2. Khi điền Excel
- 📝 Sử dụng dropdown thay vì gõ tay
- 📝 Tuân thủ format: `Tên - Môn - Phòng`
- 📝 Để trống các ô không có tiết học
- 📝 Kiểm tra kỹ trước khi lưu

### 3. Xử lý lỗi
- 🔍 Đọc kỹ thông báo lỗi và cảnh báo
- 🔍 Sửa từng lỗi một cách có hệ thống
- 🔍 Import lại sau khi sửa lỗi
- 🔍 Kiểm tra kết quả sau khi import

### 4. Tối ưu hóa
- ⚡ Import theo từng khối lớp
- ⚡ Sử dụng "Thay thế hiện có" khi cần
- ⚡ Backup thời khóa biểu cũ trước khi thay thế
- ⚡ Test với 1-2 lớp trước khi import hàng loạt

---

## 🔄 QUY TRÌNH IMPORT NHANH

```
1️⃣ CẤU HÌNH
   ↓
2️⃣ TẢI FILE MẪU
   ↓
3️⃣ ĐIỀN THÔNG TIN
   ↓
4️⃣ UPLOAD & IMPORT
   ↓
5️⃣ KIỂM TRA KẾT QUẢ
```

---

## 📞 HỖ TRỢ

### Khi cần hỗ trợ:
1. Kiểm tra log lỗi chi tiết trong kết quả import
2. Đảm bảo dữ liệu chuẩn bị đầy đủ
3. Thử import với 1 lớp trước khi import hàng loạt
4. Liên hệ admin với thông tin chi tiết lỗi

### Thông tin cần cung cấp:
- File Excel đã điền
- Thông báo lỗi chi tiết
- Cấu hình đã chọn
- Screenshots màn hình lỗi

**Chúc bạn import thời khóa biểu thành công! 🎉** 