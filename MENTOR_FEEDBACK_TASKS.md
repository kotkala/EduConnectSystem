# EduConnect - Mentor Feedback Implementation Tasks

## 📋 Overview
This document outlines all tasks required to implement mentor feedback from Thầy Phương. Tasks are organized by priority and complexity.

## 🎯 Phase 1: Foundation & Quick Wins (2-3 weeks)

### 1.1 Academic Year Management System
- [ ] **Task**: Create academic year dropdown in global header
- [ ] **Description**: Add dropdown to switch between academic years globally
- [ ] **Technical Requirements**:
  - Global state management for current academic year
  - Persistent storage of selected year
  - Auto-close completed academic years
  - UI component in header/sidebar
- [ ] **Files to modify**: `components/layout/`, `lib/stores/`
- [ ] **Complexity**: Low
- [ ] **Priority**: High

### 1.2 Class Listing by Academic Year
- [ ] **Task**: Filter classes by selected academic year
- [ ] **Description**: Show only classes belonging to current academic year
- [ ] **Technical Requirements**:
  - Update class queries to filter by academic_year_id
  - Modify class listing components
  - Add academic year context to class pages
- [ ] **Files to modify**: `app/dashboard/admin/classes/`, `lib/actions/class-actions.ts`
- [ ] **Complexity**: Low
- [ ] **Priority**: High

### 1.3 Student Management in Classes
- [ ] **Task**: Add/remove students from specific classes
- [ ] **Description**: CRUD operations for student-class assignments
- [ ] **Technical Requirements**:
  - Student assignment/unassignment UI
  - Bulk operations for multiple students
  - Validation for class capacity limits
  - Assignment history tracking
- [ ] **Files to modify**: `app/dashboard/admin/classes/[id]/`, `components/admin/student-assignment/`
- [ ] **Complexity**: Medium
- [ ] **Priority**: High

### 1.4 School-wide Student Directory
- [ ] **Task**: Create comprehensive student management screen
- [ ] **Description**: Central location to manage all students across school
- [ ] **Technical Requirements**:
  - Search and filter capabilities
  - Bulk operations
  - Export functionality
  - Student status tracking
- [ ] **Files to create**: `app/dashboard/admin/students/`, `components/admin/student-directory/`
- [ ] **Complexity**: Medium
- [ ] **Priority**: High

## 🔧 Phase 2: Core Architecture Changes (4-6 weeks)

### 2.1 User vs Student Separation
- [ ] **Task**: Separate User and Student entities
- [ ] **Description**: Students can exist without user accounts
- [ ] **Technical Requirements**:
  - Create new `students` table
  - Migrate existing student data
  - Update all student-related queries
  - Maintain backward compatibility during migration
- [ ] **Database Changes**:
  ```sql
  CREATE TABLE students (
    id UUID PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) NULL,
    date_of_birth DATE,
    address TEXT,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] **Files to modify**: All student-related components and actions
- [ ] **Complexity**: Very High
- [ ] **Priority**: Medium
- [ ] **Risk**: High (data migration required)

### 2.2 Enhanced Teacher-Class Relationships
- [ ] **Task**: Implement many-to-many teacher-class relationships
- [ ] **Description**: Teachers can be homeroom teacher of one class but subject teacher of multiple classes
- [ ] **Technical Requirements**:
  - UI for assigning multiple teachers to classes
  - Role-based teacher assignments (homeroom vs subject)
  - Teacher workload visualization
  - Conflict detection for scheduling
- [ ] **Files to modify**: `components/admin/teacher-assignment/`, `lib/actions/teacher-actions.ts`
- [ ] **Complexity**: Medium
- [ ] **Priority**: High

### 2.3 Class Detail Page with Tabs
- [ ] **Task**: Create comprehensive class detail page
- [ ] **Description**: Single page with all class information organized in tabs
- [ ] **Technical Requirements**:
  - Tab 1: Student list with add/remove functionality
  - Tab 2: Subject assignments and teachers
  - Tab 3: Class information and homeroom teacher
  - Tab 4: Timetable and schedule
- [ ] **Files to create**: `app/dashboard/admin/classes/[id]/page.tsx`, `components/admin/class-detail/`
- [ ] **Complexity**: Medium
- [ ] **Priority**: High

## 📚 Phase 3: Educational Features (4-5 weeks)

### 3.1 Lesson Record System (Sổ đầu bài)
- [ ] **Task**: Implement lesson recording functionality
- [ ] **Description**: Teachers can record lesson content, attendance, and homework
- [ ] **Technical Requirements**:
  - Daily lesson entry forms
  - Attendance tracking integration
  - Homework assignment recording
  - Lesson plan templates
- [ ] **Database Changes**:
  ```sql
  CREATE TABLE lesson_records (
    id UUID PRIMARY KEY,
    timetable_event_id UUID REFERENCES timetable_events(id),
    teacher_id UUID REFERENCES profiles(id),
    lesson_date DATE NOT NULL,
    lesson_content TEXT,
    attendance_notes TEXT,
    homework_assigned TEXT,
    materials_used TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] **Files to create**: `app/dashboard/teacher/lesson-records/`, `components/teacher/lesson-record-form/`
- [ ] **Complexity**: Medium
- [ ] **Priority**: Medium

### 3.2 Grade Management Business Rules
- [ ] **Task**: Implement comprehensive grade import system
- [ ] **Description**: Handle various grade import scenarios with proper validation
- [ ] **Technical Requirements**:
  - Import scope selection (school/grade/class/subject)
  - Student matching by student ID
  - Column mapping and validation
  - Partial import error handling
  - Override vs merge policies
  - Import history and rollback
- [ ] **Database Changes**:
  ```sql
  CREATE TABLE grade_import_sessions (
    id UUID PRIMARY KEY,
    scope_type TEXT CHECK (scope_type IN ('school', 'grade_level', 'class', 'subject')),
    scope_ids UUID[],
    import_rules JSONB,
    file_format TEXT,
    status TEXT,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_log JSONB,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] **Files to create**: `app/dashboard/admin/grade-import/`, `components/admin/grade-import/`
- [ ] **Complexity**: Very High
- [ ] **Priority**: Medium
- [ ] **Risk**: High (data integrity concerns)

## ⚖️ Phase 4: Discipline & Reporting (3-4 weeks)

### 4.1 Enhanced Violation Point System
- [ ] **Task**: Implement violation severity and point accumulation
- [ ] **Description**: Track violation points with automatic actions and reset policies
- [ ] **Technical Requirements**:
  - Violation severity levels and point values
  - Automatic action triggers (warnings, parent meetings)
  - Point accumulation tracking
  - Reset policies (semester/year/manual)
  - Parent notification integration
- [ ] **Database Changes**:
  ```sql
  CREATE TABLE violation_point_rules (
    id UUID PRIMARY KEY,
    academic_year_id UUID REFERENCES academic_years(id),
    point_threshold INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    action_description TEXT,
    reset_policy TEXT CHECK (reset_policy IN ('semester', 'year', 'manual')),
    is_active BOOLEAN DEFAULT true
  );
  
  CREATE TABLE student_violation_summaries (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES profiles(id),
    academic_year_id UUID REFERENCES academic_years(id),
    semester_id UUID REFERENCES semesters(id),
    total_points INTEGER DEFAULT 0,
    current_status TEXT,
    last_action_date DATE,
    last_reset_date DATE,
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] **Files to modify**: `app/dashboard/admin/violations/`, `components/admin/violation-management/`
- [ ] **Complexity**: High
- [ ] **Priority**: Medium

### 4.2 Periodic Reporting System
- [ ] **Task**: Create AI-powered student progress reports
- [ ] **Description**: Generate periodic reports with AI summaries and parent feedback
- [ ] **Technical Requirements**:
  - Reporting period management (monthly/semester/yearly)
  - AI-generated student summaries
  - Parent feedback and approval system
  - Email notification integration
  - Report templates and customization
- [ ] **Database Changes**:
  ```sql
  CREATE TABLE reporting_periods (
    id UUID PRIMARY KEY,
    academic_year_id UUID REFERENCES academic_years(id),
    semester_id UUID REFERENCES semesters(id),
    period_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    report_type TEXT CHECK (report_type IN ('monthly', 'semester', 'yearly')),
    status TEXT DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE TABLE student_reports (
    id UUID PRIMARY KEY,
    reporting_period_id UUID REFERENCES reporting_periods(id),
    student_id UUID REFERENCES profiles(id),
    ai_generated_summary TEXT,
    teacher_notes TEXT,
    parent_feedback TEXT,
    parent_approval_status TEXT DEFAULT 'pending',
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] **Files to create**: `app/dashboard/teacher/reports/`, `components/teacher/report-generation/`
- [ ] **Complexity**: High
- [ ] **Priority**: Low

## 🔄 Phase 5: Advanced Features (Optional - 6-8 weeks)

### 5.1 Class Combination/Splitting Logic
- [ ] **Task**: Handle combined and split classes
- [ ] **Description**: Manage virtual classes for combined subjects
- [ ] **Technical Requirements**:
  - Virtual class creation
  - Student assignment to multiple class contexts
  - Timetable management for combined classes
  - Grade recording for split contexts
- [ ] **Complexity**: Very High
- [ ] **Priority**: Low
- [ ] **Risk**: Very High
- [ ] **Recommendation**: Consider postponing or using simplified approach

### 5.2 UI/UX Consistency
- [ ] **Task**: Standardize UI across all screens
- [ ] **Description**: Ensure consistent design language and user experience
- [ ] **Technical Requirements**:
  - Design system documentation
  - Component library standardization
  - Responsive design improvements
  - Accessibility compliance
- [ ] **Files to modify**: All UI components
- [ ] **Complexity**: Medium
- [ ] **Priority**: Medium

## 📊 Performance & Security Tasks (Ongoing)

### Database Optimization
- [ ] **Task**: Add missing RLS policies
- [ ] **Task**: Remove duplicate indexes
- [ ] **Task**: Add composite indexes for common queries
- [ ] **Task**: Implement security definer functions

### Code Quality
- [ ] **Task**: Ensure all components use React.memo where appropriate
- [ ] **Task**: Implement proper TypeScript types
- [ ] **Task**: Follow SonarLint rules consistently
- [ ] **Task**: Maintain Vercel Speed Insights compliance

## 🚨 Risk Assessment

### High Risk Items:
1. **User/Student separation** - Complex data migration
2. **Grade import system** - Data integrity concerns
3. **Class combination logic** - Complex business rules

### Medium Risk Items:
1. **Violation point system** - Business rule complexity
2. **Reporting system** - AI integration challenges

### Low Risk Items:
1. **Academic year management** - Straightforward implementation
2. **Class detail pages** - Standard CRUD operations
3. **UI consistency** - Time-consuming but low technical risk

## 📅 Recommended Timeline

**Total Estimated Time**: 15-20 weeks
**Recommended Approach**: Implement phases sequentially
**Critical Path**: Phase 1 → Phase 2.1 → Phase 2.2 → Phase 3.1

## ✅ Success Criteria

- [ ] All mentor requirements implemented
- [ ] No performance degradation
- [ ] Maintains Vercel Speed Insights scores
- [ ] Zero ESLint warnings
- [ ] Successful build and deployment
- [ ] User acceptance testing passed

## 🛠️ Technical Implementation Notes

### Database Migration Strategy
1. **Backup Strategy**: Full database backup before any schema changes
2. **Migration Scripts**: Create reversible migration scripts
3. **Testing**: Test migrations on staging environment first
4. **Rollback Plan**: Prepare rollback procedures for each major change

### Performance Considerations
1. **Index Optimization**: Add composite indexes for common query patterns
2. **Query Optimization**: Use proper joins and avoid N+1 queries
3. **Caching Strategy**: Implement Redis caching for frequently accessed data
4. **Bundle Optimization**: Maintain code splitting and lazy loading

### Security Requirements
1. **RLS Policies**: Implement comprehensive Row Level Security
2. **Input Validation**: Validate all user inputs on both client and server
3. **Access Control**: Implement proper role-based access control
4. **Audit Logging**: Track all data modifications

### Code Quality Standards
1. **TypeScript**: Maintain strict TypeScript compliance
2. **ESLint**: Zero warnings policy
3. **Testing**: Unit tests for all business logic
4. **Documentation**: Comprehensive code documentation

## 📋 Pre-Implementation Checklist

### Before Starting Each Phase:
- [ ] Review current codebase structure
- [ ] Identify affected components and files
- [ ] Create feature branch
- [ ] Set up local development environment
- [ ] Run `bun lint` and `bun run build` to ensure clean baseline

### During Implementation:
- [ ] Follow incremental development approach
- [ ] Test each component individually
- [ ] Run verification commands frequently
- [ ] Maintain performance benchmarks
- [ ] Document any architectural decisions

### After Each Task:
- [ ] Run full test suite
- [ ] Verify Vercel Speed Insights compliance
- [ ] Code review and approval
- [ ] Update documentation
- [ ] Deploy to staging for testing

## 🔄 Continuous Monitoring

### Performance Metrics to Track:
- Page load times (target: <2s)
- Bundle sizes (maintain current levels)
- Database query performance
- Memory usage patterns
- Error rates and user feedback

### Quality Metrics:
- ESLint warning count (target: 0)
- TypeScript error count (target: 0)
- Test coverage percentage
- Code complexity scores
- Security vulnerability scans
