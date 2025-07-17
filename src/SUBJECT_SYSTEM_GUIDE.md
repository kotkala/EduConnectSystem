# 🎓 Hệ Thống Môn Học EduConnect - Hướng Dẫn Hoàn Chỉnh

> **Hệ thống môn học theo chương trình Giáo dục phổ thông 2018 của Việt Nam**

---

## 📋 Tổng Quan Hệ Thống

### **Kiến trúc tổng thể**
```
📚 HỆ THỐNG MÔN HỌC EDUCONNECT
├── 🔵 Môn Học Bắt Buộc (8 môn)
├── 🟢 Môn Học Tự Chọn (9 môn - chọn 4)
├── 🟣 Cụm Môn Học (5 tổ hợp)
└── 📖 Lớp Tách & Lớp Ghép
```

---

## 🔵 Môn Học Bắt Buộc (8 môn)

Tất cả học sinh THPT phải học đủ 8 môn bắt buộc:

| STT | Môn học | Mã môn | Tín chỉ | Tiết/năm | Mô tả |
|-----|---------|--------|---------|----------|-------|
| 1 | **Ngữ văn** | `LIT` | 3 | 105 | Ngôn ngữ và văn học Việt Nam |
| 2 | **Toán** | `MATH` | 3 | 105 | Toán học cơ bản và nâng cao |
| 3 | **Tiếng Anh** | `ENG` | 3 | 105 | Ngoại ngữ 1 - Tiếng Anh |
| 4 | **Lịch sử** | `HIST` | 2 | 70 | Lịch sử Việt Nam và thế giới |
| 5 | **GDQP & AN** | `NDSE` | 1 | 35 | Giáo dục quốc phòng và an ninh |
| 6 | **HĐTN - HN** | `EXPR` | 3 | 105 | Hoạt động trải nghiệm - hướng nghiệp |
| 7 | **Giáo dục địa phương** | `LOCAL` | 1 | 35 | Nội dung giáo dục của địa phương |
| 8 | **Giáo dục thể chất** | `PE` | 2 | 70 | Thể dục và sức khỏe |

**📊 Tổng kết môn bắt buộc:** 8 môn • 18 tín chỉ • 630 tiết/năm

---

## 🟢 Môn Học Tự Chọn (9 môn - chọn 4)

Học sinh lớp 10 chọn **4 trong 9 môn** để học suốt 3 năm THPT:

| STT | Môn học | Mã môn | Tín chỉ | Tiết/năm | Nhóm |
|-----|---------|--------|---------|----------|------|
| 1 | **Địa lý** | `GEO` | 2 | 70 | Khoa học xã hội |
| 2 | **GDKT & PL** | `ECON` | 2 | 70 | Khoa học xã hội |
| 3 | **Vật lý** | `PHYS` | 2 | 70 | Khoa học tự nhiên |
| 4 | **Hóa học** | `CHEM` | 2 | 70 | Khoa học tự nhiên |
| 5 | **Sinh học** | `BIO` | 2 | 70 | Khoa học tự nhiên |
| 6 | **Công nghệ** | `TECH` | 2 | 70 | Công nghệ |
| 7 | **Tin học** | `CS` | 2 | 70 | Công nghệ |
| 8 | **Âm nhạc** | `MUSIC` | 2 | 70 | Nghệ thuật |
| 9 | **Mỹ thuật** | `ART` | 2 | 70 | Nghệ thuật |

**📊 Học sinh chọn:** 4/9 môn • 8 tín chỉ • 280 tiết/năm

---

## 🟣 Cụm Môn Học (5 tổ hợp)

Trường tổ chức **5 cụm môn học** để học sinh lựa chọn:

### **🔬 Khoa Học Tự Nhiên (2 cụm)**

#### **KHTN1 - Khoa học tự nhiên 1**
- **Tổ hợp:** Lý + Hóa + Sinh + **Tin học**
- **Chuyên đề:** Toán - Lý - Hóa
- **Đối tượng:** Học sinh hướng CNTT, Y sinh
- **Sức chứa:** 35 học sinh

#### **KHTN2 - Khoa học tự nhiên 2**
- **Tổ hợp:** Lý + Hóa + Sinh + **Công nghệ**
- **Chuyên đề:** Toán - Lý - Hóa  
- **Đối tượng:** Học sinh hướng Kỹ thuật, Y dược
- **Sức chứa:** 35 học sinh

### **🏛️ Khoa Học Xã Hội (3 cụm)**

#### **KHXH1 - Khoa học xã hội 1**
- **Tổ hợp:** Địa + GDKT-PL + Lý + **Công nghệ**
- **Chuyên đề:** Văn - Sử - Địa
- **Đối tượng:** Học sinh hướng Kinh tế kỹ thuật
- **Sức chứa:** 35 học sinh

#### **KHXH2 - Khoa học xã hội 2**
- **Tổ hợp:** Địa + GDKT-PL + Lý + **Tin học**
- **Chuyên đề:** Văn - Sử - Địa
- **Đối tượng:** Học sinh hướng Kinh tế số
- **Sức chứa:** 35 học sinh

#### **KHXH3 - Khoa học xã hội 3**
- **Tổ hợp:** Địa + GDKT-PL + **Âm nhạc** + Tin học
- **Chuyên đề:** Văn - Sử - Địa
- **Đối tượng:** Học sinh hướng Nghệ thuật số
- **Sức chứa:** 35 học sinh

---

## 📖 Lớp Tách & Lớp Ghép

### **🏫 Lớp Tách (Base Class)**
- **Mục đích:** Học các **môn bắt buộc**
- **Cấu trúc:** Lớp học thông thường (10A1, 10A2, ...)
- **Đặc điểm:** 
  - 1 GVCN cố định
  - Học sinh cùng lớp học tất cả môn bắt buộc
  - 30-35 học sinh/lớp

### **🔄 Lớp Ghép (Combined Class)**
- **Mục đích:** Học các **môn tự chọn theo cụm**
- **Cấu trúc:** Lớp được ghép từ nhiều lớp tách
- **Đặc điểm:**
  - Học sinh từ nhiều lớp khác nhau
  - Cùng chọn 1 cụm môn học
  - Tên lớp theo cụm: KHTN1-2024, KHXH2-2024

---

## 🔧 Cách Thức Hoạt Động

### **📅 Lịch học mẫu của học sinh lớp 10A1 chọn cụm KHTN1:**

| Tiết | Thứ 2 | Thứ 3 | Thứ 4 | Thứ 5 | Thứ 6 |
|------|--------|--------|--------|--------|--------|
| 1-2 | Toán (10A1) | Lý (KHTN1) | Văn (10A1) | Hóa (KHTN1) | Anh (10A1) |
| 3-4 | Văn (10A1) | Sinh (KHTN1) | Toán (10A1) | Tin (KHTN1) | Sử (10A1) |
| 5-6 | GDTC (10A1) | Anh (10A1) | GDQP (10A1) | GDĐP (10A1) | HĐTN (10A1) |

**Giải thích:**
- **Sáng:** Học môn bắt buộc với lớp 10A1
- **Chiều:** Học môn tự chọn với lớp ghép KHTN1 (có HS từ 10A1, 10A2, 10A3...)

---

## 🔧 Tính năng hệ thống

### **API Endpoints**

#### **Môn học**
- `GET /api/subjects` - Danh sách môn học
- `POST /api/subjects` - Tạo môn học mới
- `POST /api/subjects` (action: initialize) - Khởi tạo môn học chuẩn

#### **Cụm môn học**
- `GET /api/subject-groups` - Danh sách cụm môn
- `POST /api/subject-groups` - Tạo cụm môn mới
- `POST /api/subject-groups` (action: initialize) - Khởi tạo 5 cụm chuẩn

#### **Lớp học**
- `GET /api/classes` - Danh sách lớp học
- `POST /api/classes` - Tạo lớp học mới
- Filter theo `class_type`: `base_class` hoặc `combined_class`

### **UI Pages**

#### **Admin Dashboard**
- `/dashboard/admin/subjects` - Quản lý môn học
- `/dashboard/admin/subject-groups` - Quản lý cụm môn học
- `/dashboard/admin/classes` - Quản lý lớp học

### **Quy trình khởi tạo hệ thống**

1. **Khởi tạo môn học**:
   ```bash
   POST /api/subjects
   { "action": "initialize" }
   ```

2. **Khởi tạo cụm môn học**:
   ```bash
   POST /api/subject-groups
   { "action": "initialize" }
   ```

3. **Tạo lớp tách**:
   ```bash
   POST /api/classes
   {
     "name": "10A1",
     "code": "10A1",
     "class_type": "base_class",
     "academic_year_id": "...",
     "grade_level_id": "...",
     "homeroom_teacher_id": "..."
   }
   ```

4. **Tạo lớp ghép** (sau khi học sinh chọn cụm):
   ```bash
   POST /api/classes
   {
     "name": "KHTN1-2024",
     "code": "KHTN1-2024", 
     "class_type": "combined_class",
     "subject_group_code": "KHTN1",
     "academic_year_id": "...",
     "grade_level_id": "..."
   }
   ```

---

## 🎯 Lợi Ích Của Hệ Thống

### **👨‍🎓 Đối với Học sinh**
- **Linh hoạt:** Tự chọn 4/9 môn phù hợp với năng lực
- **Định hướng:** 5 cụm rõ ràng hỗ trợ chọn ngành đại học
- **Chất lượng:** Chuyên đề nâng cao theo từng cụm

### **👨‍🏫 Đối với Giáo viên**
- **Chuyên môn:** Dạy đúng chuyên ngành
- **Hiệu quả:** Không bị phân tán lực lượng
- **Linh hoạt:** Dễ dàng điều chỉnh lịch dạy

### **🏫 Đối với Nhà trường**
- **Tối ưu:** Sử dụng hiệu quả tài nguyên
- **Quản lý:** Hệ thống rõ ràng, có tổ chức
- **Mở rộng:** Dễ dàng thêm cụm mới khi cần

---

## 📊 Thống Kê Hệ Thống

| Thành phần | Số lượng | Ghi chú |
|------------|----------|---------|
| **Môn bắt buộc** | 8 môn | 100% học sinh phải học |
| **Môn tự chọn** | 9 môn | Học sinh chọn 4/9 |
| **Cụm môn học** | 5 cụm | 2 KHTN + 3 KHXH |
| **Sức chứa tối đa** | 175 HS | 35 HS × 5 cụm |
| **Chuyên đề** | 2 loại | Toán-Lý-Hóa và Văn-Sử-Địa |

---

## 🚀 Triển Khai Thực Tế

### **Bước 1: Chuẩn bị**
1. Import dữ liệu giáo viên theo chuyên môn
2. Tạo khung thời gian biểu chuẩn
3. Chuẩn bị phòng học cho từng cụm

### **Bước 2: Thực hiện**
1. Học sinh lớp 10 đăng ký chọn cụm (đầu năm học)
2. Hệ thống tạo lớp ghép tự động
3. Phân công giáo viên cho từng cụm
4. Xếp thời khóa biểu tự động

### **Bước 3: Vận hành**
1. Theo dõi điểm danh theo lớp tách/ghép
2. Quản lý điểm số theo từng môn
3. Báo cáo kết quả học tập định kỳ
4. Điều chỉnh lớp ghép khi cần thiết

---

## 🔮 Tương Lai Mở Rộng

- **AI Gợi ý:** Đề xuất cụm phù hợp với năng lực học sinh
- **VR/AR:** Mô phỏng thí nghiệm cho môn khoa học
- **Mobile App:** Ứng dụng di động cho học sinh/phụ huynh
- **Analytics:** Phân tích dữ liệu học tập nâng cao

---

> **Kết luận:** Hệ thống môn học EduConnect thực hiện đầy đủ chương trình giáo dục THPT 2018, tối ưu hóa việc dạy và học, tạo điều kiện cho học sinh phát triển theo đúng năng lực và sở thích.

**📞 Liên hệ hỗ trợ:** admin@educonnect.vn 