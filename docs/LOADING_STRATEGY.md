# 🎯 Loading Strategy - EduConnect System

## 📋 Tổng quan

Hệ thống loading của EduConnect được thiết kế theo 3 tầng rõ ràng, mỗi tầng có mục đích và cách sử dụng khác nhau:

## 🏗️ 3 Tầng Loading

### 1. 🌍 **Global & Route Loading** → `SandyLoading` (Lottie Animation)

**Mục đích:** Loading toàn màn hình cho các trạng thái quan trọng
- **Global:** Khởi tạo app, xác thực, tải dữ liệu ban đầu
- **Route:** Chuyển trang, tải trang mới

**Đặc điểm:**
- ✅ Pop up overlay toàn màn hình
- ✅ Chạy animation Lottie xoay xoay
- ✅ Tự động ẩn khi hoàn thành
- ✅ Thu hút toàn bộ sự chú ý của user

**Components:**
```tsx
// Global loading (auth, initial data)
<GlobalSandyLoading message="Đang khởi tạo ứng dụng..." />

// Route loading (page transitions)
<RouteSandyLoading message="Đang tải trang..." />
```

### 2. 🧩 **Component Loading** → `Skeleton` (Shadcn UI)

**Mục đích:** Loading inline trong component, không interrupt user flow
- Tải dữ liệu component
- Lazy loading content
- Form validation

**Đặc điểm:**
- ✅ Loading inline, không overlay
- ✅ Sử dụng skeleton animation từ Shadcn UI
- ✅ Không interrupt user flow
- ✅ Contextual với content

**Usage:**
```tsx
import { Skeleton } from '@/shared/components/ui/skeleton'

// Card loading
<div className="space-y-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </div>
</div>

// List loading
<div className="space-y-4">
  {Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="flex items-center space-x-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
  ))}
</div>

// Form loading
<div className="space-y-4">
  <Skeleton className="h-4 w-[100px]" />
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-4 w-[120px]" />
  <Skeleton className="h-10 w-full" />
</div>

// Text loading
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-[90%]" />
  <Skeleton className="h-4 w-[80%]" />
</div>

// Compact loading
<Skeleton className="h-4 w-4 rounded-full" />
```

### 3. ⚡ **Action Loading** → TBD (Để sau)

**Mục đích:** Loading cho các action như submit form, delete, update
- Form submission
- Button actions
- API calls

## 🎨 Sử dụng trong thực tế

### Global Loading (App.tsx hoặc Layout)
```tsx
import { GlobalSandyLoading } from '@/shared/components/ui/sandy-loading'

// Khi app đang khởi tạo
{isInitializing && <GlobalSandyLoading message="Đang khởi tạo ứng dụng..." />}

// Khi đang xác thực
{isAuthenticating && <GlobalSandyLoading message="Đang xác thực tài khoản..." />}
```

### Route Loading (loading.tsx files)
```tsx
import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'

// Trong app/dashboard/loading.tsx
export default function DashboardLoading() {
  return <RouteSandyLoading message="Đang tải bảng điều khiển..." />
}
```

### Component Loading
```tsx
import { Skeleton } from '@/shared/components/ui/skeleton'

// Loading cho danh sách học sinh
{isLoadingStudents ? (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-3 w-[40%]" />
        </div>
      </div>
    ))}
  </div>
) : (
  <StudentList students={students} />
)}

// Loading cho card thông tin
{isLoadingProfile ? (
  <div className="rounded-lg border bg-card p-6">
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  </div>
) : (
  <ProfileCard profile={profile} />
)}
```

### Dynamic Import Loading
```tsx
import { Skeleton } from '@/shared/components/ui/skeleton'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton className="h-4 w-4 rounded-full" />
})
```

## 🚀 Best Practices

### ✅ Nên làm:
- Sử dụng `GlobalSandyLoading` cho loading quan trọng (auth, init)
- Sử dụng `RouteSandyLoading` cho page transitions
- Sử dụng `Skeleton` component với Tailwind classes phù hợp
- Cung cấp message rõ ràng cho global loading
- Sử dụng `Skeleton` với `rounded-full` cho dynamic imports

### ❌ Không nên:
- Sử dụng SandyLoading cho component-level loading
- Sử dụng skeleton cho global/route loading
- Overlay loading cho content nhỏ
- Loading message quá dài hoặc không rõ ràng

## 🎯 Migration Guide

### Từ SandyLoading cũ:
```tsx
// ❌ Cũ - Component loading
<SandyLoading size="sm" />

// ✅ Mới - Component loading
<Skeleton className="h-4 w-4 rounded-full" />
```

### Từ LoadingSpinner:
```tsx
// ❌ Cũ - Không tồn tại
<LoadingSpinner />

// ✅ Mới - Component loading
<Skeleton className="h-4 w-4 rounded-full" />
```

### Từ LoadingFallback:
```tsx
// ❌ Cũ - Không tồn tại
<LoadingFallback />

// ✅ Mới - Route loading
<RouteSandyLoading />
```

## 🔧 Customization

### SandyLoading Messages:
```tsx
export const SANDY_LOADING_MESSAGES = {
  AUTH: "Đang xác thực tài khoản...",
  GLOBAL: "Đang khởi tạo ứng dụng...",
  ROUTE: "Đang tải trang...",
  PAGE: "Đang tải trang..."
}
```

### Skeleton Styling:
```tsx
// Custom skeleton với Tailwind
<CardSkeleton className="bg-blue-50 border-blue-200" />

// Custom animation speed
<Skeleton className="animate-pulse" style={{ animationDuration: '0.8s' }} />
```

## 📊 Performance Benefits

1. **Bundle Size:** SandyLoading chỉ load khi cần (Global/Route)
2. **UX:** Skeleton không interrupt user flow
3. **Consistency:** Design system thống nhất
4. **Accessibility:** Proper loading states cho screen readers

## 🎨 Design Tokens

Skeleton sử dụng Shadcn UI design tokens:
- `bg-muted`: Background color
- `animate-pulse`: Animation
- `rounded-md`: Border radius
- `text-muted-foreground`: Text color

SandyLoading sử dụng:
- `bg-background/80`: Overlay background
- `backdrop-blur-sm`: Blur effect
- `z-50`: High z-index cho overlay
