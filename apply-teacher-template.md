# Teacher Pages Cần Chuẩn Hóa

## Danh sách các trang cần áp dụng TeacherPageTemplate:

### ✅ Đã hoàn thành:
1. ✅ grade-management/page.tsx
2. ✅ schedule/page.tsx  
3. ✅ violations/page.tsx

### ❌ Còn lại cần làm:
4. ❌ homeroom-students/page.tsx
5. ❌ homeroom-grades/page.tsx
6. ❌ grade-reports/page.tsx
7. ❌ reports/page.tsx
8. ❌ meetings/page.tsx
9. ❌ feedback/page.tsx
10. ❌ leave-requests/page.tsx
11. ❌ schedule-change/page.tsx

### Pattern áp dụng:

```tsx
// 1. Thêm import
import { TeacherPageTemplate } from "@/shared/components/dashboard/teacher-page-template"

// 2. Thay thế return
return (
  <TeacherPageTemplate
    title="Tên trang"
    description="Mô tả trang"
    actions={<Button>Actions</Button>}
    showCard={false}
  >
    {/* Nội dung trang */}
  </TeacherPageTemplate>
)
```

### Mapping tên trang:
- homeroom-students → "Học sinh lớp chủ nhiệm"
- homeroom-grades → "Điểm số lớp chủ nhiệm"  
- grade-reports → "Báo cáo điểm số"
- reports → "Báo cáo học tập"
- meetings → "Cuộc họp"
- feedback → "Phản hồi"
- leave-requests → "Đơn xin nghỉ"
- schedule-change → "Thay đổi lịch dạy"
