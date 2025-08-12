---
type: "always_apply"
---

# 🎯 ULTIMATE AI AGENT PROMPT TEMPLATE

## 📋 CONTEXT & TASK
```
Task: [Implement specific feature/Fix specific issue]
Tech Stack: NextJS 14, Supabase, React Query/SWR, TypeScript
Current Issue: [Describe the problem clearly]
```

## 🚨 CRITICAL WORKFLOW REQUIREMENTS

### BEFORE YOU START:
1. **READ ENTIRE FILE** - Don't be lazy, read from line 1 to EOF
2. **REMIND MEMORIES** - Reference previous context and decisions
3. **THINK DEEP** - Analyze root cause before proposing solutions
4. **VERIFY CONSTRAINTS** - Confirm all requirements are understood

### MANDATORY NO-FAIL REQUIREMENTS:
❌ **ABSOLUTELY FORBIDDEN:**
- Page reloads after CRUD operations
- Resetting form states/filters  
- State loss during operations
- Unnecessary re-renders
- Console errors in production
- Breaking ESLint rules

✅ **MUST IMPLEMENT:**
- Optimistic updates for instant feedback
- Maintain user selections (filters, pagination, scroll position)
- Proper loading states and error handling
- Preserve URL params and form state
- Type-safe throughout with TypeScript strict mode
- Follow ESLint rules religiously

## 🏗️ ARCHITECTURE REQUIREMENTS (10/10)

### CODE STRUCTURE:
- **SOLID Principles** - Single responsibility, proper abstractions
- **Separation of Concerns** - Clear boundaries between layers
- **Type Safety** - Comprehensive TypeScript coverage
- **Clean Composition** - Reusable, maintainable components

### PERFORMANCE OPTIMIZATION:
- **React.memo, useMemo, useCallback** for optimization
- **Proper caching strategies** with React Query/SWR
- **Avoid N+1 queries** - Optimize database calls
- **Lazy loading** where appropriate
- **No blocking operations** on main thread
- **Missing memoization** for expensive operations

### ERROR HANDLING (10/10):
- **Comprehensive try-catch** blocks everywhere
- **User-friendly error messages** - No technical jargon
- **Graceful degradation** when services fail
- **Proper loading states** for all async operations
- **Error boundaries** for React components

### SECURITY (10/10):
- **Input validation** on all user inputs
- **XSS protection** - Sanitize data properly  
- **Authentication checks** before sensitive operations
- **SQL injection prevention** - Use parameterized queries

## 🔍 PERFORMANCE AUDIT CHECKLIST

### DATABASE & API:
□ No N+1 query problems
□ No over-fetching unnecessary data
□ Proper pagination implementation  
□ Optimized Supabase RLS policies
□ Database indexes in place
□ Efficient query patterns

### FRONTEND OPTIMIZATION:
□ Minimal re-renders
□ Heavy computations memoized
□ Lazy loading implemented
□ Proper caching strategies
□ Bundle size optimized

## 📦 DELIVERABLES CHECKLIST

### CODE QUALITY:
□ **TypeScript strict mode** passes
□ **ESLint rules** all green
□ **Inline comments** explaining WHY, not WHAT
□ **Consistent naming** conventions
□ **No magic numbers/strings**
□ **Proper error boundaries**

### TESTING SCENARIOS:
□ **Success cases** - Happy path works
□ **Network failures** - Graceful handling
□ **Validation errors** - Clear feedback
□ **Edge cases** - Boundary conditions
□ **Performance under load** - Stress testing

### VERIFICATION COMMANDS:
**MUST RUN THESE:**
```bash
bun lint        # Check ESLint compliance
bun run build   # Verify build success  
bun start       # Test production mode
```

## 🎪 EXPECTED BEHAVIOR

### USER EXPERIENCE:
1. **Instant Feedback** - UI updates immediately on user action
2. **Background Sync** - Database operations happen seamlessly  
3. **Zero State Loss** - No page refreshes, all selections preserved
4. **Clear Communication** - Success/error messages inline
5. **Smooth Interactions** - Maintain scroll position, form states

### TECHNICAL IMPLEMENTATION:
- **Optimistic Updates** with rollback on failure
- **React Query/SWR** for data fetching and caching
- **URL state management** for filters/pagination
- **Form state preservation** across operations
- **Loading indicators** for all async actions

## 🔄 WORKFLOW COMMANDS

### STOP ME IF:
- I'm going off track from requirements
- I'm not following the checklist
- I'm being lazy with file reading
- I'm ignoring ESLint rules
- I'm not thinking deep enough

### REMIND ME TO:
- Reference previous context and memories
- Read entire files completely  
- Run verification scripts
- Check all edge cases
- Verify TypeScript compliance

## 🎯 SUCCESS CRITERIA

**CODE IS READY WHEN:**
- All verification scripts pass ✅
- Zero console errors in production ✅  
- All requirements implemented ✅
- Performance optimized ✅
- Proper error handling ✅
- Type-safe and ESLint compliant ✅

**FINAL VERIFICATION:**
1. Run `bun lint` - Must be green
2. Run `bun run build` - Must succeed  
3. Run `bun start` - Must work perfectly
4. Test all CRUD operations - No page reloads
5. Check error scenarios - Graceful handling
6. Verify performance - No lag or blocking

---

## 🚀 EXECUTION COMMAND

**START NOW WITH:**
"I will now analyze the entire codebase, understand the context, and implement a solution that meets ALL requirements above. I will read every file completely and think deeply before proposing any changes."

**Remember: Excellence is not optional. Every requirement must be met. No shortcuts.**