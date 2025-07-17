# EduConnect System - Master Project Checklist

> **Luôn đọc kỹ rules, documents, memory, và checklist này trước khi làm bất kỳ task nào.**
> Không được thay đổi database schema. Ưu tiên maintainability, scalability, customizability, reusability.

---

## 1. Foundation & Project Rules
- [x] Đọc kỹ toàn bộ rules, documents, memory, và database schema
- [x] Đảm bảo mọi task đều tuân thủ context7, shadcn/ui, best practices
- [x] Checklist này luôn được cập nhật và là xương sống cho mọi task

## 2. Authentication (Supabase)
- [x] Đã hoàn thành (không chỉnh sửa thêm)

## 3. API Development (Context7, RESTful, Scalable)
- [x] Chuẩn hóa các route, response, error handling, logging
- [x] User Management (CRUD, role-based, bulk import/export)
- [x] **User Excel Import/Export - Role-based Tabs**
  - [x] Excel template API theo role (GET /api/users/excel-template?role=...)
  - [x] Excel import API với validation và DB transaction (POST /api/users/import-excel)
  - [x] Cải tiến Excel template cho từng role với tab riêng biệt
  - [x] Student Excel template bao gồm thông tin parent đầy đủ
  - [x] Parent-Student relationship handling trong Excel import
  - [x] Validation parent email trùng khớp với student import
- [ ] Class Management (CRUD, assign teacher/student, pagination, filter)
- [ ] Grade Level Management (CRUD, assign class, ...)
- [ ] Parent/Student Relationship APIs
- [ ] Import/Export APIs (Excel, CSV, ...)
- [ ] Audit Log APIs
- [ ] Notification APIs
- [ ] Modular hóa các service/action để dễ tái sử dụng

## 4. UI/UX (shadcn/ui, context7, Modern, Accessible)
- [x] Chuẩn hóa layout, theme, responsive, dark mode
- [x] User Table, Form, Modal (role-based, dynamic fields)
- [x] Import/Export UI (feedback, error report, template download)
- [x] **Enhanced User Management UI**
  - [x] Role-based tabs cho Excel import/export
  - [x] Student tab với parent information fields
  - [x] Parent tab với student selection/linkage
  - [x] Teacher tabs (homeroom vs subject teacher)
  - [x] School administrator tab
  - [x] Improved import result display với parent-student relationship feedback
- [ ] Class Table, Form, Modal
- [ ] Grade Level Table, Form, Modal
- [ ] Parent/Student Management UI
- [ ] Notification UI
- [ ] Loading, error, empty, and success states cho mọi component
- [ ] Tối ưu UX cho admin, dễ thao tác, dễ mở rộng

## 5. Maintainability & Scalability
- [x] Tách biệt rõ logic, UI, API, types, utils
- [ ] Viết test cho API, UI, business logic
- [ ] Logging, error boundary, monitoring
- [ ] Tài liệu hóa code, hướng dẫn sử dụng, maintain rõ ràng
- [ ] Đảm bảo code dễ customize, dễ mở rộng module mới
- [ ] Định kỳ review/refactor để tối ưu performance và maintainability

## 6. Customizability & Reusability
- [x] Modular hóa các component, hooks, service, schema
- [ ] Chuẩn hóa types/interfaces, dễ mở rộng cho entity mới
- [ ] Tối ưu import/export, dễ tích hợp với hệ thống khác
- [ ] Đảm bảo mọi logic có thể override/extend mà không phá vỡ core

## 7. Project Tracking & Quality Assurance
- [x] Mỗi task đều phải update trạng thái vào checklist này
- [ ] Đảm bảo test coverage, error handling, logging cho mọi feature
- [ ] Review định kỳ checklist, rules, documents để không bỏ sót yêu cầu

---

## 🚀 IMMEDIATE NEXT STEPS (User Management Focus)

### ✅ Priority 1: Enhanced Excel Import/Export - COMPLETED
1. ✅ **Role-based Excel Templates** - Tạo template riêng cho từng role
2. ✅ **Student-Parent Integration** - Student Excel bao gồm parent info
3. ✅ **Tab-based UI** - UI với tabs cho từng role
4. ✅ **Relationship Validation** - Đảm bảo parent-student consistency

### ✅ Priority 2: UI/UX Improvements - COMPLETED
1. ✅ **Tabbed Interface** - Role-based tabs cho import/export
2. ✅ **Enhanced Forms** - Dynamic forms theo role
3. ✅ **Relationship Display** - Hiển thị parent-student relationships
4. ✅ **Error Handling** - Improved error feedback cho relationships

### ✅ Priority 3: Data Integrity - COMPLETED
1. ✅ **Validation Rules** - Business rules cho parent-student
2. ✅ **Transaction Safety** - Atomic operations cho related data
3. ✅ **Audit Logging** - Track all user operations
4. ✅ **Data Consistency** - Ensure email uniqueness across roles

### 🔄 Priority 4: Next Focus Areas
1. **Class Management** - CRUD operations với teacher/student assignment
2. **Grade Level Management** - CRUD operations với class assignment
3. **Enhanced User Display** - Improved table với parent-student relationships
4. **Performance Optimization** - Caching, pagination, search optimization

---

> **Ghi chú:**
> - Không được thay đổi database schema.
> - Luôn đọc lại checklist, rules, documents trước khi làm task mới.
> - Sau mỗi task, tick vào checklist và ghi chú lại các điểm cần tối ưu/maintain.
> - Ưu tiên maintainability, scalability, customizability, reusability cho mọi code.
> - Focus hiện tại: User Management với Excel import theo role và parent-student relationships. 