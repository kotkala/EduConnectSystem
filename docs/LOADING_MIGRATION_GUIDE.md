# 🔄 Loading System Migration Guide

## 🎯 **MIGRATION ROADMAP**

Hướng dẫn chi tiết để fix **7 files** đang dùng Sandy Loading sai chỗ.

---

## 📋 **FILES CẦN FIX**

### **1. 🌐 Route: `/dashboard/admin/analytics`**
**File:** `app/dashboard/admin/analytics/analytics-client.tsx`

#### **❌ Hiện tại:**
```tsx
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

// Trong component
if (isLoading) {
  return <RouteSandyLoading message="Đang tải analytics..." />
}
```

#### **✅ Nên thay bằng:**
```tsx
import { StatsCardsSkeleton } from '@/shared/components/ui/admin-skeletons'

// Trong component
if (isLoading) {
  return <StatsCardsSkeleton count={4} />
}
```

---

### **2. 🌐 Route: `/dashboard/parent/grades`**
**File:** `app/dashboard/parent/grades/parent-grades-client.tsx`

#### **❌ Hiện tại:**
```tsx
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

if (isLoading) {
  return <RouteSandyLoading message="Đang tải điểm số..." />
}
```

#### **✅ Nên thay bằng:**
```tsx
import { TableSkeleton } from '@/shared/components/ui/admin-skeletons'

if (isLoading) {
  return <TableSkeleton rows={8} columns={5} title="Bảng điểm" />
}
```

---

### **3. 🌐 Route: `/dashboard/teacher/grade-reports`**
**File:** `app/dashboard/teacher/grade-reports/teacher-grade-reports-client.tsx`

#### **❌ Hiện tại:**
```tsx
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

if (isLoading) {
  return <RouteSandyLoading message="Đang tải báo cáo..." />
}
```

#### **✅ Nên thay bằng:**
```tsx
import { TableSkeleton, StatsCardsSkeleton } from '@/shared/components/ui/admin-skeletons'

if (isLoading) {
  return (
    <div className="space-y-6">
      <StatsCardsSkeleton count={3} />
      <TableSkeleton rows={10} columns={6} title="Báo cáo điểm" />
    </div>
  )
}
```

---

### **4. 🌐 Route: `/student/grades`**
**File:** `app/student/grades/student-grades-simple.tsx`

#### **❌ Hiện tại:**
```tsx
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

if (isLoading) {
  return <RouteSandyLoading message="Đang tải điểm..." />
}
```

#### **✅ Nên thay bằng:**
```tsx
import { TableSkeleton } from '@/shared/components/ui/admin-skeletons'

if (isLoading) {
  return <TableSkeleton rows={6} columns={4} title="Điểm số của em" />
}
```

---

### **5. 🌐 Route: `/student/timetable`**
**File:** `app/student/timetable/student-timetable-simple.tsx`

#### **❌ Hiện tại:**
```tsx
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

if (isLoading) {
  return <RouteSandyLoading message="Đang tải thời khóa biểu..." />
}
```

#### **✅ Nên thay bằng:**
```tsx
import { Skeleton } from '@/shared/components/ui/skeleton'

if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[200px]" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
```

---

### **6. 🌐 Route: `/dashboard/teacher/timetable` (Component)**
**File:** `features/timetable/components/teacher-schedule-big-calendar.tsx`

#### **❌ Hiện tại:**
```tsx
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

if (isLoading) {
  return <RouteSandyLoading message="Đang tải lịch dạy..." />
}
```

#### **✅ Nên thay bằng:**
```tsx
import { Skeleton } from '@/shared/components/ui/skeleton'

if (isLoading) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  )
}
```

---

### **7. 🌐 Route: `/dashboard/admin/timetable` (Component)**
**File:** `features/timetable/components/timetable-big-calendar.tsx`

#### **❌ Hiện tại:**
```tsx
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

if (isLoading) {
  return <RouteSandyLoading message="Đang tải thời khóa biểu..." />
}
```

#### **✅ Nên thay bằng:**
```tsx
import { Skeleton } from '@/shared/components/ui/skeleton'

if (isLoading) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[80px]" />
          <Skeleton className="h-10 w-[80px]" />
        </div>
      </div>
      <Skeleton className="h-[700px] w-full rounded-lg" />
    </div>
  )
}
```

---

## 🔧 **MIGRATION STEPS**

### **Step 1: Backup & Identify**
```bash
# Backup files trước khi edit
git add .
git commit -m "Backup before loading migration"

# Identify files cần fix
grep -r "RouteSandyLoading" src/app/dashboard/admin/analytics/
grep -r "RouteSandyLoading" src/app/dashboard/parent/grades/
# ... etc
```

### **Step 2: Replace Imports**
```tsx
// Remove
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

// Add appropriate skeleton imports
import { StatsCardsSkeleton, TableSkeleton } from '@/shared/components/ui/admin-skeletons'
import { Skeleton } from '@/shared/components/ui/skeleton'
```

### **Step 3: Replace Loading Components**
- Thay `<RouteSandyLoading />` bằng appropriate skeleton
- Đảm bảo skeleton phù hợp với content type
- Test loading states

### **Step 4: Verify & Test**
```bash
# Test loading states
npm run dev

# Check console for loading conflicts
# Verify UX improvements (no full-screen blocking)
```

---

## 📊 **SKELETON COMPONENT REFERENCE**

### **Admin Skeletons:**
```tsx
// Stats cards (analytics, dashboards)
<StatsCardsSkeleton count={4} />

// Data tables
<TableSkeleton rows={8} columns={5} title="Table Title" />

// Forms
<FormSkeleton fields={6} title="Form Title" />

// Complete admin page
<AdminPageSkeleton hasStats={true} hasFilters={true} hasTable={true} />
```

### **Basic Skeletons:**
```tsx
// Custom layouts
<Skeleton className="h-[400px] w-full" />

// Text content
<Skeleton className="h-4 w-[200px]" />

// Circular (avatars)
<Skeleton className="h-10 w-10 rounded-full" />
```

---

## ✅ **VERIFICATION CHECKLIST**

### **After Migration:**
- [ ] No more `RouteSandyLoading` in component files
- [ ] Only `loading.tsx` files use Sandy Loading
- [ ] Appropriate skeletons cho each content type
- [ ] No loading conflicts in console
- [ ] Better UX (non-blocking loading)
- [ ] Responsive skeleton behavior

### **Testing:**
- [ ] Test slow network conditions
- [ ] Verify loading states work correctly
- [ ] Check mobile responsiveness
- [ ] Ensure no console errors

---

## 🚨 **IMPORTANT NOTES**

1. **KHÔNG touch `loading.tsx` files** - chúng đang đúng
2. **CHỈ fix component-level** Sandy Loading usage
3. **Test thoroughly** sau mỗi file migration
4. **Keep consistent** skeleton patterns
5. **Document any custom** skeleton needs

---

**📝 Migration Priority:** High - affects UX significantly
**📅 Timeline:** Should be completed in 1-2 days
**🧪 Testing:** Required for each file migration
