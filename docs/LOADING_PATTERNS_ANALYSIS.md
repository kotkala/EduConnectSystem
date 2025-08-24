# 🔍 Loading Patterns Analysis

## 📊 Current Loading State Analysis

### ✅ **Pages Using Loading Coordinator (Correct)**

#### 1. **Report Periods Page** (`src/app/dashboard/admin/report-periods/page.tsx`)
- **Global Loading**: `useGlobalLoading()` cho initial data loading ✅
- **Section Loading**: `useSectionLoading()` cho class progress loading ✅  
- **Component Loading**: `useComponentLoading()` cho button actions ✅
- **Status**: ✅ Correct pattern

#### 2. **Classes Page** (`src/app/dashboard/admin/classes/page.tsx`)
- **Section Loading**: `useSectionLoading()` cho class data loading ✅
- **Status**: ✅ Fixed - No longer uses global loading overlay

### ⚠️ **Pages Using Direct useLoading (Needs Review)**

#### 1. **Parent Dashboard** (`src/app/dashboard/parent/page.tsx`)
- **Pattern**: Direct `useLoading()` calls
- **Issue**: May cause global loading overlay
- **Recommendation**: Migrate to Loading Coordinator

#### 2. **Other Pages Using Local Loading**
- **Pattern**: `useState` for local loading states
- **Status**: ✅ Acceptable - No conflicts with global loading

### 🎯 **Loading Pattern Guidelines**

#### **Global Loading** (`useGlobalLoading`)
- **Use for**: Initial page data loading, route transitions
- **Behavior**: Full-screen SandyLoading overlay
- **Example**: Loading initial data when page first loads

#### **Section Loading** (`useSectionLoading`) 
- **Use for**: Non-blocking operations, data refreshes
- **Behavior**: Local loading state, skeleton components
- **Example**: Loading class progress, refreshing data

#### **Component Loading** (`useComponentLoading`)
- **Use for**: Form submissions, button actions
- **Behavior**: Button disabled state, loading spinners
- **Example**: Submit forms, send notifications

## 🚨 **Issues Found & Fixed**

### 1. **Classes Page Global Loading Overlay** ✅ FIXED
- **Issue**: Used `useGlobalLoading()` causing full-screen overlay
- **Fix**: Changed to `useSectionLoading()` for section-level loading
- **Result**: No more overlay on sidebar

### 2. **Loading Coordinator Hook Improvement** ✅ FIXED
- **Issue**: `useGlobalLoading()` didn't return global loading state
- **Fix**: Updated to return `isGlobalLoading` state
- **Result**: Better state management

## 📋 **Recommendations**

### 1. **Migrate Parent Dashboard**
```typescript
// Current (needs migration)
const { startLoading, stopLoading } = useLoading()

// Recommended
const { startLoading, stopLoading } = useSectionLoading("Đang tải thông tin...")
```

### 2. **Standardize Loading Patterns**
- Use **Global Loading** only for initial page loads
- Use **Section Loading** for data refreshes and non-blocking operations
- Use **Component Loading** for user actions

### 3. **Monitor Loading Conflicts**
- Use `useLoadingDebug()` hook in development
- Check console warnings for multiple loading states
- Ensure proper startLoading/stopLoading pairing

## ✅ **Current Status**

- **Loading Conflicts**: ✅ Resolved
- **Global Loading Overlay**: ✅ Fixed (no longer appears on sidebar)
- **Consistent Patterns**: ✅ Implemented
- **Debug Tools**: ✅ Available

## 🎯 **Next Steps**

1. **Monitor** loading behavior in production
2. **Migrate** any remaining direct `useLoading()` calls
3. **Document** loading patterns for team reference
4. **Test** loading scenarios across different pages
