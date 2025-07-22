---
type: "always_apply"
---

# Augment AI Agent Memories - Complete Configuration

# Context7 Integration & Code Generation
- User requires Context7 integration for all library-specific code generation: always include "use context7" command when working with external libraries to fetch current documentation before generating code.
- User strongly prefers Context7 example fidelity over improvements: follow exact patterns, syntax, and APIs from Context7 documentation without modifications, enhancements, or "best practice" additions. Balance: minimal adaptation is allowed only to fit the specific use case requirements without changing core patterns.
- User requires strict version compatibility: use only the exact versions shown in Context7 documentation, avoid mixing APIs from different versions or assuming backward compatibility.
- User prefers minimal Context7 example adaptation: only modify examples to fit the specific use case requirements, resist adding extra features, abstractions, or complex patterns not present in the original documentation.
- User requires single-context workflow: handle one library context per generation task, avoid combining multiple Context7 queries or mixing different library patterns in single code generation sessions.

# Code Generation Quality Control
- User strongly prefers incremental code changes over comprehensive rewrites: modify ONE file or feature at a time, never generate multiple new files simultaneously to avoid compatibility issues. Exception: when creating a complete new feature module, generate all related files together but ensure they form a cohesive, testable unit.
- User requires explicit file management communication: when creating new files, always ask if old files should be deleted; when refactoring, clearly state which files will be modified, created, or removed before proceeding.
- User prefers existing dependency utilization: use project's current dependencies first, only suggest new packages when absolutely necessary and with explicit user confirmation.
- User strongly prefers build-first approach over feature-rich generation: create minimal working code first, then enhance incrementally rather than generating complex patterns or abstractions upfront. Balance: ensure minimal code is still complete enough to be functional and testable.
- User requires lint compatibility maintenance: follow existing project code style and formatting, avoid introducing new linting rules or conflicting formatting patterns.
- User prefers targeted problem-solving over comprehensive refactoring: when fixing issues, address only the specific problem without refactoring unrelated code or implementing unrequested improvements.
- User requires version awareness validation: always confirm framework and library versions when uncertain, as different versions have significantly different APIs and patterns.

# Codebase Thoroughness & Dead Code Prevention
- User requires comprehensive project scanning: before making any changes, scan the entire project structure to identify all related files, folders, and dependencies that might be affected by the requested changes. Balance with incremental approach: scan comprehensively but implement changes incrementally.
- User strongly prefers complete implementation over partial work: when creating new features or folders, ensure ALL necessary files are generated and properly connected, never leave empty directories or incomplete implementations. Clarification: "complete" means functionally complete and testable, not feature-rich or over-engineered.
- User requires dead code detection and cleanup: after completing any refactoring or feature implementation, actively scan for and remove unused files, empty directories, orphaned imports, and unreferenced code that may have been created during the process.
- User prefers implementation verification: after generating code, verify that all created files are properly imported, referenced, and integrated into the existing codebase - do not assume connections work without explicit verification.
- User requires folder structure completion: when creating new directories for features, ensure they contain all necessary files (components, types, utils, etc.) and are properly connected to the main application structure.
- User strongly prefers proactive cleanup over reactive fixes: during code generation, continuously check for and remove any temporary files, unused imports, or redundant code rather than leaving cleanup for later.
- User requires cross-reference validation: when modifying or creating files, check all related files that import or reference the modified code to ensure consistency and prevent broken references.

# Task Completion & Performance Standards
- User requires consistent quality across all tasks: maintain the same level of thoroughness and attention to detail from first task to last task, regardless of task sequence position or session length.
- User strongly prefers explicit task tracking over assumed completion: when given multiple tasks, create a numbered checklist and mark completion status for each task explicitly, never assume tasks are finished without explicit verification.
- User requires completion verification protocol: before declaring any task "finished" or "completed", verify that ALL requirements have been met and provide specific evidence of completion (file paths, code snippets, test results).
- User prefers incremental progress reporting: for multi-task sessions, provide regular progress updates showing "Task X of Y completed" with brief status summary, maintaining awareness of remaining work.
- User strongly prefers energy consistency over rushed completion: maintain the same level of code quality, error checking, and thoroughness throughout the entire task sequence, do not reduce effort or cut corners as tasks progress.
- User requires explicit permission for task completion: never declare a multi-task session "finished" or "completed" without explicit user confirmation that all tasks meet requirements and no additional work is needed.
- User prefers detailed completion summaries over brief acknowledgments: when completing tasks, provide comprehensive summary of what was accomplished, what files were modified/created, and what functionality was implemented.
- User requires performance self-monitoring: if quality or thoroughness begins to decline during a session, explicitly acknowledge this and ask for a brief pause or clarification rather than continuing with reduced performance.
- User strongly prefers over-completion over under-completion: when uncertain about task scope, err on the side of doing more thorough work rather than leaving tasks partially implemented.

# Error Recovery & Build Validation
- User requires immediate error acknowledgment: when build or lint errors occur after code generation, immediately acknowledge the specific error without making excuses or explanations about why it happened.
- User strongly prefers surgical error fixes over code rewrites: fix only the exact lines causing build/lint errors, do not refactor surrounding code or implement alternative approaches unless the current approach is fundamentally incompatible.
- User requires error isolation strategy: when fixing errors, change ONE thing at a time and ask user to test build/lint before making additional changes to avoid compounding errors.
- User prefers rollback option communication: when errors persist after initial fix attempt, offer to revert changes and try a different minimal approach rather than continuing to modify the problematic code.
- User requires build validation workflow: after any code generation or modification, explicitly remind user to run build and lint commands to catch errors early before proceeding with additional changes.

# Project Integration Standards
- User prefers compatibility-first code generation: check project dependencies, package.json, and existing code patterns before generating new code to ensure seamless integration.
- User strongly prefers cleanup responsibility isolation: maintain clear boundaries between requested changes and potential improvements, avoid scope creep during code generation tasks.
- User requires error prevention priority: prioritize generating code that builds successfully over implementing advanced features or following theoretical best practices.

# Conflict Resolution & Edge Case Handling
- User requires explicit conflict communication: when user requests conflict with established memories or best practices, explicitly state the conflict and ask for clarification on priority before proceeding.
- User prefers pragmatic flexibility over rigid adherence: in emergency situations (tight deadlines, critical bugs), prioritize working solutions over perfect adherence to all guidelines while maintaining core quality standards (build success, no dead code).
- User requires escalation protocol: when facing contradictory requirements or impossible constraints, present 2-3 alternative approaches with trade-offs clearly explained rather than making assumptions.
- User strongly prefers transparency over silent compromises: when forced to deviate from established guidelines due to technical constraints or user requirements, explicitly communicate what guidelines are being modified and why.
- User requires context-aware adaptation: adjust thoroughness level based on task urgency - maintain full rigor for feature development, allow streamlined approach for urgent bug fixes, always maintain build integrity regardless of urgency.
- User prefers collaborative problem-solving: when encountering scenarios not covered by existing guidelines, ask for clarification and propose new guideline additions rather than improvising solutions that may conflict with established patterns.

# Technology & Environment Preferences
- User uses Bun package manager for builds instead of npm: always use `bun run` commands for scripts and `bun install` for package management.
- User prefers Google OAuth + email OTP authentication over password-based auth.
- User strongly prefers simple, minimal authentication architecture with single responsibility files over complex abstractions, custom hooks, or wrapper components.
- User strongly prefers immediate 6-digit OTP code delivery for new users without any email confirmation step - wants to completely eliminate email confirmation flow in favor of direct OTP authentication.
- User prefers modern Next.js 15+ API patterns with consolidated route files, route grouping strategies, and simplified RESTful design that reduces cognitive overhead while maintaining full CRUD functionality.
- User prefers modern Next.js 15 App Router structure with proper separation of client/server components, organized Shadcn UI components, structured Supabase integration with separated database queries/auth logic, and comprehensive TypeScript configuration for full-stack projects.

# Project Structure & Architecture Preferences  
- User strongly prefers simple, direct architecture over complex abstractions and wants to reduce project complexity by ~75% while maintaining all functionality, prioritizing developer experience and maintainability.
- User prefers clean, simple, non-complex architecture over fragmented structures with many folders/files and wants to avoid systems that generate warnings and errors.
- User prefers clean project structure with main src/ directory containing only essential documentation.
- User wants technical reports moved to dedicated docs/ directory.
- User wants well-organized documentation hierarchy with clear indexing.
- User prefers minimal package.json scripts (only dev, build, start, lint) and prioritizes simplicity over extensive tooling.
- User prefers simple project structure without complex automation scripts, focusing on core functionality rather than maintenance/optimization automation.
- User prefers documentation-first approach for major system rebuilds: create comprehensive docs backup of all functionality before deletion, then clean slate implementation with documented features as reference to ensure zero functionality loss.
- Always remove dead code and unused files immediately after refactoring - don't leave redundant pages, components, or files that are no longer used in the system.