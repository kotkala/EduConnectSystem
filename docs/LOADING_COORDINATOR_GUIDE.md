# 🎯 Loading Coordinator Guide

## Tổng quan

Loading Coordinator được thiết kế để giải quyết các conflicts trong hệ thống loading của EduConnect. Nó standardizes loading patterns và ngăn chặn race conditions.

## 🚨 Các Conflicts Đã Được Giải Quyết

### 1. **Loading Provider Race Conditions**
- **Vấn đề**: Nhiều component gọi `startLoading()` đồng thời
- **Giải pháp**: Queue system với loading count tracking
- **Kết quả**: Không còn loading screen vĩnh viễn

### 2. **Global + Route Loading Overlap**
- **Vấn đề**: SandyLoading + Route loading.tsx xung đột
- **Giải pháp**: Route loading chỉ hiển thị khi không có global loading
- **Kết quả**: Không còn double loading screens

### 3. **Inconsistent Loading Patterns**
- **Vấn đề**: Một số component dùng global, một số dùng local loading
- **Giải pháp**: Standardized hooks với clear purposes
- **Kết quả**: Consistent UX across components

## 🎯 Cách Sử Dụng

### 1. **Global Loading** - Cho initial data loading và route transitions

```typescript
import { useGlobalLoading } from '@/shared/hooks/use-loading-coordinator'

export function MyComponent() {
  const { startLoading, stopLoading } = useGlobalLoading("Đang tải dữ liệu...")
  
  const loadData = async () => {
    startLoading()
    try {
      await fetchData()
    } finally {
      stopLoading()
    }
  }
}
```

### 2. **Section Loading** - Cho non-blocking operations

```typescript
import { useSectionLoading } from '@/shared/hooks/use-loading-coordinator'

export function MyComponent() {
  const { isLoading, startLoading, stopLoading } = useSectionLoading("Đang tải...")
  
  const loadSectionData = async () => {
    startLoading()
    try {
      await fetchSectionData()
    } finally {
      stopLoading()
    }
  }
  
  return (
    <div>
      {isLoading && <Skeleton />}
      <DataContent />
    </div>
  )
}
```

### 3. **Component Loading** - Cho form submissions và button actions

```typescript
import { useComponentLoading } from '@/shared/hooks/use-loading-coordinator'

export function MyForm() {
  const { isLoading, startLoading, stopLoading } = useComponentLoading()
  
  const handleSubmit = async () => {
    startLoading()
    try {
      await submitForm()
    } finally {
      stopLoading()
    }
  }
  
  return (
    <Button disabled={isLoading} onClick={handleSubmit}>
      {isLoading ? "Đang gửi..." : "Gửi"}
    </Button>
  )
}
```

## 🔧 Cấu Trúc Hệ Thống

### Loading Provider (Improved)
```typescript
// src/shared/components/ui/loading-provider.tsx
- Queue system để tránh race conditions
- Loading count tracking
- Validation cho quá nhiều loading states
- clearAllLoading() function
```

### Route Loading (Coordinated)
```typescript
// src/app/dashboard/loading.tsx
- Chỉ hiển thị khi không có global loading
- Tránh xung đột với SandyLoading
```

### Loading Coordinator Hooks
```typescript
// src/shared/hooks/use-loading-coordinator.ts
- useGlobalLoading() - Cho initial data và route transitions
- useSectionLoading() - Cho non-blocking operations  
- useComponentLoading() - Cho form submissions và button actions
```

## 🐛 Debug Tools

### Loading Debug Hook
```typescript
import { useLoadingDebug } from '@/shared/hooks/use-loading-debug'

export function App() {
  useLoadingDebug() // Chỉ active trong development
  
  return <YourApp />
}
```

### Console Warnings
- Quá nhiều loading states (>10)
- Multiple loading elements detected
- Global loading start/stop logs

## 📋 Best Practices

### ✅ Nên Làm
1. **Sử dụng đúng hook cho đúng purpose**
   - Global loading cho initial data
   - Section loading cho non-blocking operations
   - Component loading cho user actions

2. **Always pair startLoading/stopLoading**
   ```typescript
   startLoading()
   try {
     await operation()
   } finally {
     stopLoading() // Luôn được gọi
   }
   ```

3. **Use loading coordinator hooks thay vì direct useLoading**
   ```typescript
   // ✅ Good
   const { startLoading, stopLoading } = useGlobalLoading()
   
   // ❌ Avoid
   const { startLoading, stopLoading } = useLoading()
   ```

### ❌ Không Nên Làm
1. **Gọi startLoading mà không gọi stopLoading**
2. **Sử dụng global loading cho component-level operations**
3. **Tạo multiple loading states cho cùng một operation**

## 🔄 Migration Guide

### Từ Old Loading Pattern
```typescript
// ❌ Old way
const [isLoading, setIsLoading] = useState(false)
const { startLoading, stopLoading } = useLoading()

// ✅ New way
const { isLoading, startLoading, stopLoading } = useComponentLoading()
```

### Từ Direct useLoading
```typescript
// ❌ Old way
const { startLoading, stopLoading } = useLoading()

// ✅ New way
const { startLoading, stopLoading } = useGlobalLoading("Custom message")
```

## 🎯 Kết Quả

Sau khi implement Loading Coordinator:

1. **Không còn loading conflicts**
2. **Consistent UX** across all components
3. **Better performance** với coordinated loading states
4. **Easier debugging** với debug tools
5. **Standardized patterns** cho team development

## 📞 Support

Nếu gặp vấn đề với loading states:
1. Check console warnings
2. Use useLoadingDebug() hook
3. Verify loading hook usage
4. Check for unpaired startLoading/stopLoading calls
