---
type: "always_apply"
---

ULTIMATE AI CODING PROMPT - FINAL VERSION

CORE RULES - NON-NEGOTIABLE:

READ ENTIRE FILE before any changes - don't be lazy with first 50 lines
PERFORMANCE FIRST - every decision optimized for speed
ZERO TOLERANCE for bugs - code must work 100% first try
10/10 LOGIC QUALITY or reject task completely
PRODUCTION-READY code only, no prototype garbage
MANDATORY WORKFLOW - DON'T SKIP:

Load memory context - check what failed before
Read complete codebase - identify all bottlenecks
Apply proven success patterns automatically
Verify with: bun lint (0 errors), bun run build (success), bun start (<2000ms)
CONTEXT7 MEMORY BANK - NEVER REPEAT THESE FAILURES:

Auth missing: Always check user auth + roles before server actions
useEffect fetch loops: Use SWR/React Query for data fetching
N+1 queries: Batch database queries with include/select
Props in useState: Process props in useEffect, not initial state
Random keys: Use stable IDs for React keys
TypeScript any: Define proper interfaces always
Unmemoized lists: Use useMemo for expensive filtering/sorting
Missing error boundaries: Wrap components in try-catch
Console.log in production: Remove all debug code
Server actions without validation: Use Zod schemas
SUCCESS PATTERNS - AUTO-APPLY:
Server Actions (saves 300ms):

export async function serverAction(formData: FormData) {
  const user = await auth();
  if (!user) throw new Error('Unauthorized');
  
  const data = schema.parse(Object.fromEntries(formData));
  const result = await db.$transaction(async (tx) => {
    // batch operations here
  });
  revalidateTag(`model-${result.id}`);
  return { success: true, data: result };
}
React Components (saves 150ms):

const Component = memo(({ items, userId }) => {
  const filtered = useMemo(() => 
    items.filter(item => item.userId === userId).slice(0, 50)
  , [items, userId]);
  
  const handleAction = useCallback((id) => {
    startTransition(() => serverAction(id));
  }, []);
  
  if (!filtered.length) return <EmptyState />;
  return <div>{filtered.map(item => <Item key={item.id} />)}</div>;
});
Database Queries (saves 200ms):

const getData = async (userId) => {
  return await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
    include: { posts: { take: 10, select: { id: true, title: true }}}
  });
};
PERFORMANCE LIMITS - HARD FAIL IF EXCEEDED:

First Contentful Paint: 1200ms
Largest Contentful Paint: 2000ms
API Response Time: 150ms
Database Query: 80ms
Bundle Size: 200KB per route
Memory Usage: 50MB peak
INSTANT CODE REJECTION - AUTO-FAIL:

useEffect(() => {}, []) with missing dependencies
setState(props.value)
key={Math.random()}
Spread operators in render functions
TypeScript 'any' usage
console.log statements
Fetch without error handling
Missing auth checks in server actions
TASK TYPES - CONTEXT SWITCHING: Bug Fix: Root cause analysis → Targeted fix → Regression test Performance: Baseline measurement → Bottleneck optimization → A/B verification
Feature: UX design → Performance impact → Quality gates Refactor: Architecture review → Incremental changes → Metric validation

VERCEL OPTIMIZATION - MANDATORY:

Use next/image with priority prop
Use next/font with swap fallback
Dynamic imports for components >50KB
Implement ISR with revalidation
Add Speed Insights tracking
Enable Gzip compression
MEDICINE FOR COMMON BUGS:
Hydration errors: Use suppressHydrationWarning or client-only rendering
Memory leaks: Cleanup useEffect listeners and timers
Slow queries: Add database indexes and limit select fields
State sync issues: Use React Query for server state management
Layout shifts: Reserve space for dynamic content

MANDATORY AI RESPONSE FORMAT:
MEMORY_CHECK: [Previous failures: X, Success patterns loaded: Y]
CODEBASE_ANALYSIS: [Files scanned: X, Issues found: Y, Bottlenecks: Z]
PERFORMANCE_BASELINE: [Current FCP: Xms, LCP: Yms, Bundle: ZKB]
SOLUTION_APPROACH: [Method, Complexity O(n), Expected improvement: Xms]
VERIFICATION_STATUS: [Lint: PASS/FAIL, Build: PASS/FAIL, Performance: PASS/FAIL]
PRODUCTION_READY: [YES/NO with specific blockers]

FORBIDDEN RESPONSES:

"This should work"
"Try this approach"
"Let me know if issues"
"Might need tweaking"
Any response without performance metrics
FAILURE CONDITIONS - RESTART TASK:

Any ESLint warning/error
Build failure
Performance regression >100ms
Logic quality <9/10
Repeating known bug patterns
Missing type safety
EXECUTION COMMANDS:
Before coding: LOAD_MEMORY → READ_CODEBASE → IDENTIFY_PATTERNS → SET_TARGETS
During coding: APPLY_PATTERNS → OPTIMIZE_PERFORMANCE → VALIDATE_LOGIC
After coding: RUN_VERIFICATION → UPDATE_MEMORY → CONFIRM_PRODUCTION_READY

SUCCESS METRICS:

ESLint errors: 0
Build status: Success
Performance grade: A or B (Vercel Speed Insights)
Logic quality: 9/10 or higher
Type safety: 100%
Test coverage: 80%+
Memory leaks: 0
FINAL RULE: CODE LIKE YOUR REPUTATION DEPENDS ON IT. EVERY LINE REVIEWED BY SENIORS. ZERO TOLERANCE FOR MEDIOCRITY. FAST CODE THAT WORKS > BEAUTIFUL CODE THAT'S SLOW.

