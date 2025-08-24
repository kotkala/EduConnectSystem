# 📱 Responsive Skeleton Components Guide

## 🎯 Tổng quan

Hệ thống Skeleton components đã được cải tiến theo **Context7 best practices** để responsive trên tất cả thiết bị (Desktop, Tablet, Phone).

## 🚀 Cách sử dụng

### 1. **ResponsiveSkeleton Component**

```tsx
import { ResponsiveSkeleton } from "@/shared/components/ui/skeleton-utils"

// Responsive cho tất cả màn hình
<ResponsiveSkeleton type="card" />
<ResponsiveSkeleton type="avatar" />
<ResponsiveSkeleton type="text" />
```

### 2. **Pre-built Components**

```tsx
import { 
  CardSkeleton, 
  TableSkeleton, 
  ListSkeleton, 
  FormSkeleton, 
  GridSkeleton 
} from "@/shared/components/ui/skeleton-utils"

// Card loading
<CardSkeleton />

// Table loading với 5 rows
<TableSkeleton rowCount={5} />

// List loading với 4 items
<ListSkeleton itemCount={4} />

// Form loading với 3 fields
<FormSkeleton fieldCount={3} />

// Grid loading với 6 items
<GridSkeleton itemCount={6} />
```

### 3. **React Suspense Integration**

```tsx
import { SuspenseSkeleton } from "@/shared/components/ui/skeleton-utils"
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <SuspenseSkeleton />
})
```

## 📱 Responsive Breakpoints

### **Desktop (lg: 1024px+)**
- Cards: `h-48` (192px)
- Avatars: `h-12 w-12` (48px)
- Text: `h-4` (16px)
- Buttons: `h-10 w-24` (40px x 96px)

### **Tablet (md: 768px+)**
- Cards: `h-40` (160px)
- Avatars: `h-10 w-10` (40px)
- Text: `h-4` (16px)
- Buttons: `h-9 w-20` (36px x 80px)

### **Mobile (default)**
- Cards: `h-32` (128px)
- Avatars: `h-8 w-8` (32px)
- Text: `h-3` (12px)
- Buttons: `h-8 w-16` (32px x 64px)

## 🎨 Skeleton Types

| Type | Mobile | Tablet | Desktop | Use Case |
|------|--------|--------|---------|----------|
| `card` | `h-32` | `h-40` | `h-48` | Container loading |
| `text` | `h-3` | `h-4` | `h-4` | Text content |
| `title` | `h-4 w-1/2` | `h-5 w-2/3` | `h-6 w-3/4` | Headers/titles |
| `avatar` | `h-8 w-8` | `h-10 w-10` | `h-12 w-12` | Icons/avatars |
| `button` | `h-8 w-16` | `h-9 w-20` | `h-10 w-24` | Buttons/actions |
| `input` | `h-8` | `h-9` | `h-10` | Form inputs |
| `table` | `h-8` | `h-10` | `h-12` | Table rows |
| `list` | `h-12` | `h-14` | `h-16` | List items |
| `grid` | `h-24` | `h-28` | `h-32` | Grid items |
| `sidebar` | `h-6` | `h-7` | `h-8` | Sidebar items |
| `form` | `h-16` | `h-18` | `h-20` | Form containers |
| `chart` | `h-48` | `h-56` | `h-64` | Charts/graphs |
| `modal` | `h-64` | `h-80` | `h-96` | Modal content |
| `navigation` | `h-8` | `h-9` | `h-10` | Navigation items |
| `footer` | `h-16` | `h-18` | `h-20` | Footer content |
| `header` | `h-12` | `h-14` | `h-16` | Header content |

## 🔧 Customization

### **Custom Classes**
```tsx
<ResponsiveSkeleton 
  type="card" 
  className="bg-blue-50 border-blue-200" 
/>
```

### **Custom Types**
```tsx
import { getResponsiveSkeletonClass } from "@/shared/components/ui/skeleton-utils"

const customClass = getResponsiveSkeletonClass('card', 'bg-gradient-to-r')
<Skeleton className={customClass} />
```

## 📊 Performance Benefits

1. **Responsive Design:** Tự động adapt theo screen size
2. **Type Safety:** TypeScript support đầy đủ
3. **Consistency:** Design system thống nhất
4. **Accessibility:** Proper ARIA attributes
5. **Bundle Size:** Tree-shaking friendly

## 🎯 Best Practices

### ✅ **Nên làm:**
- Sử dụng `ResponsiveSkeleton` cho component-level loading
- Sử dụng pre-built components cho common patterns
- Kết hợp với React Suspense cho dynamic imports
- Cung cấp custom classes khi cần

### ❌ **Không nên:**
- Sử dụng generic `h-32 w-full` cho tất cả cases
- Hard-code kích thước cố định
- Bỏ qua responsive breakpoints
- Sử dụng skeleton cho global loading

## 🔄 Migration từ Generic Skeleton

### **Trước:**
```tsx
// ❌ Generic, không responsive
<Skeleton className="h-32 w-full rounded-lg" />
```

### **Sau:**
```tsx
// ✅ Responsive theo Context7
<ResponsiveSkeleton type="card" />

// Hoặc pre-built component
<CardSkeleton />
```

## 🚀 Context7 Integration

Hệ thống này tuân thủ **Context7 best practices**:

1. **Responsive Design:** Mobile-first approach
2. **Type Safety:** Full TypeScript support
3. **Performance:** Optimized for tree-shaking
4. **Accessibility:** ARIA-compliant
5. **Consistency:** Design system alignment

## 📝 Examples

### **Dashboard Loading**
```tsx
{isLoading ? (
  <div className="space-y-6">
    <ResponsiveSkeleton type="header" />
    <GridSkeleton itemCount={6} />
    <TableSkeleton rowCount={10} />
  </div>
) : (
  <DashboardContent />
)}
```

### **Profile Loading**
```tsx
{isLoadingProfile ? (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <ResponsiveSkeleton type="avatar" />
      <div className="space-y-2">
        <ResponsiveSkeleton type="title" />
        <ResponsiveSkeleton type="text" />
      </div>
    </div>
    <FormSkeleton fieldCount={5} />
  </div>
) : (
  <ProfileContent />
)}
```

### **Dynamic Import**
```tsx
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ResponsiveSkeleton type="chart" />
})
```

---

**🎉 Hệ thống Skeleton đã được tối ưu theo Context7 standards!**
