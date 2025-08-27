# 🔄 EduConnectSystem - Loading System Analysis

## 📊 **TỔNG QUAN HỆ THỐNG LOADING**

Hệ thống có **5 KIỂU LOADING** chính với các mục đích và cách hoạt động khác nhau:

| **Kiểu Loading** | **Số Files** | **Nguồn gốc** | **Mục đích** |
|------------------|--------------|---------------|--------------|
| 🏖️ **Sandy Loading** | 14 files | Custom | Global/Route level |
| 🦴 **Skeleton** | 74 files | Shadcn-ui + Custom | Component level |
| 🔘 **Button Loading** | 97 files | Standard patterns | Form/Action states |
| 🎯 **Loading Coordinator** | 3 files | Custom hooks | Conflict management |
| 📁 **Loading Infrastructure** | 9 files | Custom providers | System management |

---

## 🏖️ **1. SANDY LOADING SYSTEM (Custom)**

### **Cách thức hoạt động:**
- **Full-screen overlay** với Lottie animation
- **Blocking UI** - ngăn user interaction
- **Auto-managed** qua LoadingProvider
- **Queue system** - handle multiple loading states

### **Components:**
```tsx
// Global Sandy Loading - Full screen overlay
<GlobalSandyLoading message="Đang khởi tạo ứng dụng..." />

// Route Sandy Loading - Page transitions  
<RouteSandyLoading message="Đang tải trang..." />
```

### **Vị trí hiện tại theo Route URL:**

#### **✅ ĐÚNG - Route Level Loading:**
```
🌐 /dashboard → loading.tsx ✅
🌐 /dashboard/admin → loading.tsx ✅
🌐 /dashboard/parent → loading.tsx ✅
🌐 /dashboard/teacher → loading.tsx ✅
🌐 /student → loading.tsx ✅
```

#### **❌ SAI - Component Level (CẦN FIX):**
```
🌐 /dashboard/admin/analytics → analytics-client.tsx ❌
🌐 /dashboard/parent/grades → parent-grades-client.tsx ❌
🌐 /dashboard/teacher/grade-reports → teacher-grade-reports-client.tsx ❌
🌐 /student/grades → student-grades-simple.tsx ❌
🌐 /student/timetable → student-timetable-simple.tsx ❌
🌐 /dashboard/teacher/timetable → teacher-schedule-big-calendar.tsx ❌ (component)
🌐 /dashboard/admin/timetable → timetable-big-calendar.tsx ❌ (component)
```

#### **🔧 Infrastructure:**
```
📁 shared/components/ui/
├── loading-provider.tsx
└── sandy-loading.tsx
```

---

## 🦴 **2. SKELETON SYSTEM (Shadcn-ui + Custom)**

### **Cách thức hoạt động:**
- **Inline placeholders** - không block UI
- **Animate-pulse** animation
- **Responsive** - adapt theo screen size
- **Non-blocking** - user có thể interact với phần khác

### **Components Architecture:**

#### **Base (Shadcn-ui):**
```tsx
// src/shared/components/ui/skeleton.tsx
<Skeleton className="h-4 w-[200px]" />
```

#### **Custom Utilities:**
```tsx
// src/shared/components/ui/skeleton-utils.tsx
<ResponsiveSkeleton type="card" />
<CardSkeleton />
<TableSkeleton />
<ListSkeleton />
```

#### **Admin Specialized:**
```tsx
// src/shared/components/ui/admin-skeletons.tsx
<StatsCardsSkeleton count={4} />
<TableSkeleton rows={5} columns={6} />
<FormSkeleton fields={6} />
<AdminPageSkeleton />
```

### **Vị trí hiện tại theo Route:**
```
📁 dashboard/admin/
├── academic/page.tsx
├── academic-years/page.tsx
├── analytics/page.tsx
├── classes/page.tsx
├── classrooms/page.tsx
├── grade-improvement/admin-grade-improvement-client.tsx
├── grade-overwrite-approvals/page.tsx
├── grade-periods/page.tsx
├── report-periods/page.tsx
├── teacher-assignments/teacher-assignment-client.tsx
├── users/students/students-page-client.tsx
├── users/teachers/page.tsx
└── users/teachers/teachers-page-client.tsx

📁 dashboard/parent/
├── leave-application/create/page.tsx
├── leave-application/page.tsx
├── leave-status/page.tsx
├── violations/page.tsx
├── violations/parent-violations-page-client.tsx
└── page.tsx

📁 dashboard/teacher/
├── grade-management/page.tsx
├── homeroom-grades/page.tsx
├── homeroom-students/page.tsx
├── page.tsx
└── teacher-weekly-dashboard.tsx

📁 student/
├── grade-improvement/student-grade-improvement-client.tsx
└── page.tsx

📁 features/ (components)
├── admin-management/components/admin/...
├── authentication/components/...
├── grade-management/components/...
├── meetings/components/...
├── notifications/components/...
├── parent-dashboard/components/...
├── teacher-management/components/...
├── timetable/components/...
└── violations/components/...
```
**Total: 74 files** sử dụng skeleton correctly

---

## 🔘 **3. BUTTON/FORM LOADING (Standard Patterns)**

### **Cách thức hoạt động:**
- **Local component state** - chỉ affect button/form
- **Disabled state** - prevent multiple submissions
- **Loading indicators** - spinner, text changes

### **Patterns:**
```tsx
// isLoading pattern
const [isLoading, setIsLoading] = useState(false)
<Button disabled={isLoading}>
  {isLoading ? "Đang lưu..." : "Lưu"}
</Button>

// Pending pattern (React Query/Server Actions)
<Button disabled={isPending}>
  {isPending ? "Đang xử lý..." : "Gửi"}
</Button>
```

### **Vị trí hiện tại theo Route:**
```
📁 dashboard/admin/
├── academic-years/page.tsx
├── analytics/analytics-client.tsx
├── classes/page.tsx
├── classrooms/page.tsx
├── grade-improvement/admin-grade-improvement-client.tsx
├── grade-overwrite-approvals/page.tsx
├── grade-periods/page.tsx
├── grade-tracking/page.tsx
├── report-periods/page.tsx
├── users/students/students-page-client.tsx
├── users/teachers/teachers-page-client.tsx
├── violations/violations-page-client.tsx
└── loading.tsx

📁 dashboard/parent/
├── leave-application/page.tsx
├── leave-status/page.tsx
├── loading.tsx
└── page.tsx

📁 dashboard/teacher/
├── grade-management/page.tsx
├── grade-reports/teacher-grade-reports-client.tsx
├── homeroom-grades/page.tsx
├── leave-requests/page.tsx
├── reports/teacher-reports-client.tsx
├── loading.tsx
└── teacher-weekly-dashboard.tsx

📁 student/
├── grade-improvement/student-grade-improvement-client.tsx
├── timetable/student-timetable-filters.tsx
├── timetable/student-timetable-simple.tsx
└── loading.tsx

📁 features/ (forms & dialogs)
├── admin-management/components/admin/...
├── authentication/components/...
├── grade-management/components/...
├── meetings/components/...
├── notifications/components/...
├── parent-dashboard/components/...
├── schedule-change/components/...
├── teacher-management/components/...
├── timetable/components/...
└── violations/components/...
```
**Total: 97 files** với button loading patterns

---

## 🎯 **4. LOADING COORDINATOR SYSTEM (Custom)**

### **Cách thức hoạt động:**
- **Conflict prevention** - tránh multiple loading overlays
- **Smart routing** - global vs local loading
- **Hook-based** - easy integration

### **Hooks:**
```tsx
// Global loading - for initial data
const { isLoading, startLoading, stopLoading } = useGlobalLoading()

// Section loading - for non-blocking operations  
const { isLoading, startLoading, stopLoading } = useSectionLoading()

// Custom coordinator
const loading = useLoadingCoordinator({
  useGlobalLoading: true,
  isBlocking: true,
  message: "Custom message"
})
```

### **Vị trí theo Route:**
```
📁 shared/hooks/
├── use-loading-coordinator.ts
└── use-loading-debug.ts
```

---

## 📁 **5. LOADING INFRASTRUCTURE (Custom)**

### **LoadingProvider:**
```tsx
// Global state management
<LoadingProvider>
  <App />
</LoadingProvider>
```

### **Features:**
- **Queue management** - handle multiple loading requests
- **Conflict detection** - prevent overlapping loaders
- **Debug mode** - development monitoring
- **Auto-cleanup** - prevent memory leaks

### **Vị trí theo Route:**
```
📁 shared/components/ui/
└── loading-provider.tsx

📁 app/
└── providers.tsx (integration)
```

---

## 🚨 **VẤN ĐỀ CẦN FIX**

### **Sandy Loading đang "xâm lấn" Skeleton territory:**

| **Route** | **Hiện tại** | **Nên dùng** | **Lý do** |
|-----------|--------------|--------------|-----------|
| `/dashboard/admin/analytics` | Sandy Loading | `StatsCardsSkeleton` | Component-level data |
| `/dashboard/parent/grades` | Sandy Loading | `TableSkeleton` | Table data loading |
| `/dashboard/teacher/grade-reports` | Sandy Loading | `TableSkeleton` | Report table |
| `/student/grades` | Sandy Loading | `TableSkeleton` | Grade table |
| `/student/timetable` | Sandy Loading | Custom timetable skeleton | Schedule grid |
| `/dashboard/teacher/timetable` | Sandy Loading | Calendar skeleton | Calendar component |
| `/dashboard/admin/timetable` | Sandy Loading | Calendar skeleton | Calendar component |

---

## 📋 **BEST PRACTICES**

### **✅ Khi nào dùng gì:**

1. **Sandy Loading:**
   - ✅ Route transitions (`loading.tsx` files)
   - ✅ Global app initialization
   - ❌ KHÔNG dùng trong components

2. **Skeleton:**
   - ✅ Component data loading
   - ✅ Table/List loading
   - ✅ Form loading
   - ✅ Card content loading

3. **Button Loading:**
   - ✅ Form submissions
   - ✅ Action buttons
   - ✅ Save/Delete operations

4. **Loading Coordinator:**
   - ✅ Complex loading scenarios
   - ✅ Preventing conflicts
   - ✅ Global data fetching

### **❌ Anti-patterns:**
- Sandy Loading trong components
- Multiple overlapping loaders
- Không cleanup loading states
- Blocking UI cho non-critical operations

---

## 🔧 **MIGRATION PLAN**

### **Phase 1: Fix Sandy Loading misuse**
1. Replace component-level Sandy Loading với appropriate Skeletons
2. Keep Sandy Loading chỉ cho route-level

### **Phase 2: Standardize Skeleton usage**
1. Use admin-skeletons cho admin pages
2. Use skeleton-utils cho common patterns

### **Phase 3: Optimize Loading Coordinator**
1. Implement coordinator trong complex components
2. Add debug monitoring

---

**📝 Note:** File này là reference document để fix loading system đúng cách. Mọi thay đổi cần tuân thủ patterns đã định nghĩa.
