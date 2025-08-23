# 📊 **EDUCONNECT COMPLETE FILE TRACKING**
## **Fix_Features Branch - 424 Files Analysis**

---

## **📋 TRACKING SUMMARY**

### **📊 Project Statistics:**
- **Total Files**: 424 files
- **Branch**: Fix_Feature
- **Analysis Date**: 2025-01-22
- **Total Lines of Code**: ~85,000+ lines

### **📁 Directory Breakdown:**
- **app/**: 127 files (Next.js App Router)
- **features/**: 165 files (Business logic)
- **lib/**: 68 files (Utilities & actions)
- **shared/**: 62 files (Shared components)
- **providers/**: 2 files (Context providers)

---

## **🔥 CRITICAL BOTTLENECKS IDENTIFIED**

### **⚠️ MASSIVE FILES (>1000 lines) - URGENT**
```
🚨 src\app\api\chatbot\functions.ts (1982 lines) - CHATBOT LOGIC
🚨 src\lib\actions\detailed-grade-actions.ts (1597 lines) - GRADE ACTIONS
✅ REFACTORED: violation-actions.ts (1540 lines) → 7 focused files:
   ├── src\features\violations\actions\shared\violation-permissions.ts (130 lines)
   ├── src\features\violations\actions\shared\violation-queries.ts (180 lines)
   ├── src\features\violations\actions\violation-categories-actions.ts (100 lines)
   ├── src\features\violations\actions\violation-types-actions.ts (200 lines)
   ├── src\features\violations\actions\student-violations-actions.ts (425 lines)
   ├── src\features\violations\actions\violation-reports-actions.ts (300 lines)
   ├── src\features\violations\actions\disciplinary-actions.ts (280 lines)
   └── src\features\violations\actions\index.ts (70 lines)
🚨 src\app\page.tsx (1131 lines) - HOME PAGE
🚨 src\features\grade-management\actions\detailed-grade-actions.ts (1038 lines) - GRADES
🚨 src\lib\actions\admin-grade-tracking-actions.ts (1026 lines) - ADMIN GRADES
```

### **⚠️ LARGE FILES (500-999 lines) - HIGH PRIORITY**
```
📄 src\features\admin-management\actions\class-actions.ts (924 lines)
📄 src\lib\actions\report-period-actions.ts (929 lines)
📄 src\features\admin-management\actions\user-actions.ts (871 lines)
📄 src\app\dashboard\parent\reports\parent-reports-client.tsx (874 lines)
📄 src\lib\actions\enhanced-grade-actions.ts (825 lines)
📄 src\features\teacher-management\components\teacher\reports\student-report-modal.tsx (804 lines)
📄 src\features\teacher-management\components\feedback\teacher-feedback-form.tsx (786 lines)
📄 src\features\grade-management\actions\admin-grade-tracking-actions.ts (736 lines)
📄 src\features\notifications\actions\notification-actions.ts (734 lines)
📄 src\features\parent-dashboard\components\parent-chatbot\parent-chatbot.tsx (733 lines)
📄 src\features\admin-management\components\admin\violations\disciplinary-processing.tsx (743 lines)
📄 src\app\dashboard\admin\grade-improvement\admin-grade-improvement-client.tsx (732 lines)
📄 src\features\admin-management\components\admin\violations\violation-categories-manager.tsx (719 lines)
📄 src\lib\utils\grade-excel-utils.ts (711 lines)
📄 src\features\reports\actions\student-report-actions.ts (698 lines)
📄 src\features\grade-management\actions\enhanced-grade-actions.ts (688 lines)
📄 src\shared\components\ui\sidebar.tsx (651 lines)
📄 src\features\teacher-management\components\teacher\teacher-grade-tracking-dialog.tsx (624 lines)
📄 src\app\dashboard\teacher\violations\teacher-violations-page-client.tsx (603 lines)
📄 src\lib\services\ai-report-service.ts (587 lines)
📄 src\app\dashboard\admin\grade-tracking\page.tsx (581 lines)
📄 src\features\parent-dashboard\components\parent-feedback\parent-feedback-dashboard.tsx (578 lines)
📄 src\lib\actions\grade-management-actions.ts (579 lines)
📄 src\features\admin-management\components\admin\violations\violation-record-form.tsx (571 lines)
📄 src\features\grade-management\components\homeroom-feedback\student-day-modal.tsx (559 lines)
📄 src\features\admin-management\components\admin\timetable-event-form.tsx (543 lines)
📄 src\features\admin-management\actions\academic-actions.ts (544 lines)
📄 src\features\meetings\actions\meeting-actions.ts (545 lines)
📄 src\lib\actions\parent-grade-actions.ts (538 lines)
📄 src\features\admin-management\components\admin\student-parent-form.tsx (535 lines)
📄 src\app\student\grades\student-grades-client.tsx (535 lines)
📄 src\app\student\grade-improvement\student-grade-improvement-client.tsx (532 lines)
📄 src\lib\actions\teacher-grade-import-actions.ts (526 lines)
📄 src\features\teacher-management\components\teacher\teacher-grade-import-dialog.tsx (524 lines)
📄 src\app\dashboard\teacher\reports\teacher-reports-client.tsx (520 lines)
📄 src\shared\components\teacher\teacher-grade-import-dialog.tsx (520 lines)
📄 src\features\teacher-management\actions\teacher-feedback-actions.ts (517 lines)
📄 src\app\dashboard\teacher\homeroom-grades\page.tsx (514 lines)
📄 src\lib\utils\teacher-excel-import-validation.ts (503 lines)
📄 src\features\admin-management\components\admin\class-form.tsx (503 lines)
📄 src\features\admin-management\components\admin\violations\simple-violations-table.tsx (500 lines)
📄 src\features\teacher-management\actions\teacher-schedule-actions.ts (499 lines)
```

---

## **📁 COMPLETE FILE LISTING WITH LINE COUNTS**

### **🏗️ APP DIRECTORY (127 files)**
```
📁 src\app\
├── api\ (15 files)
│   ├── ai\
│   │   ├── daily-summary\route.ts (122 lines)
│   │   ├── generate-feedback\route.ts (110 lines)
│   │   ├── learn-from-feedback\route.ts (165 lines)
│   │   └── summarize-feedback\route.ts (207 lines)
│   ├── chatbot\
│   │   ├── functions.ts (1982 lines) 🚨 CRITICAL
│   │   ├── route.ts (118 lines)
│   │   └── stream\route.ts (413 lines)
│   ├── eligible-teachers\route.ts (80 lines)
│   ├── exchange-requests\
│   │   ├── approve\route.ts (83 lines)
│   │   ├── create\route.ts (95 lines)
│   │   ├── delete\route.ts (65 lines)
│   │   └── route.ts (155 lines)
│   ├── notifications\unread-count\route.ts (14 lines)
│   ├── teacher-timetable-events\route.ts (85 lines)
│   └── violations\alerts-count\route.ts (9 lines)
├── auth\ (3 files)
│   ├── auth-code-error\page.tsx (43 lines)
│   ├── callback\route.ts (106 lines)
│   └── confirm\route.ts (39 lines)
├── dashboard\ (71 pages)
│   ├── admin\ (24 pages)
│   │   ├── academic\page.tsx (361 lines)
│   │   ├── academic-years\page.tsx (428 lines)
│   │   ├── analytics\
│   │   │   ├── analytics-client.tsx (382 lines)
│   │   │   └── page.tsx (27 lines)
│   │   ├── classes\
│   │   │   ├── [id]\page.tsx
│   │   │   ├── error.tsx (100 lines)
│   │   │   └── page.tsx (249 lines)
│   │   ├── classrooms\page.tsx (194 lines)
│   │   ├── exchange-requests\page.tsx (31 lines)
│   │   ├── grade-improvement\
│   │   │   ├── admin-grade-improvement-client.tsx (732 lines) 🔥
│   │   │   └── page.tsx (9 lines)
│   │   ├── grade-overwrite-approvals\page.tsx (289 lines)
│   │   ├── grade-periods\page.tsx (270 lines)
│   │   ├── grade-tracking\
│   │   │   ├── page.tsx (581 lines) 🔥
│   │   │   └── student\[studentId]\page.tsx
│   │   ├── layout.tsx (20 lines)
│   │   ├── loading.tsx (39 lines)
│   │   ├── notifications\
│   │   │   ├── [id]\page.tsx
│   │   │   ├── create\page.tsx (48 lines)
│   │   │   └── page.tsx (13 lines)
│   │   ├── page.tsx (465 lines)
│   │   ├── report-periods\page.tsx (574 lines) 🔥
│   │   ├── subjects\page.tsx (158 lines)
│   │   ├── teacher-assignments\
│   │   │   ├── page.tsx (17 lines)
│   │   │   └── teacher-assignment-client.tsx (185 lines)
│   │   ├── timetable\page.tsx (18 lines)
│   │   ├── users\
│   │   │   ├── layout.tsx (20 lines)
│   │   │   ├── page.tsx (175 lines)
│   │   │   ├── students\
│   │   │   │   ├── page.tsx (35 lines)
│   │   │   │   └── students-page-client.tsx (212 lines)
│   │   │   └── teachers\
│   │   │       ├── page.tsx (35 lines)
│   │   │       └── teachers-page-client.tsx (197 lines)
│   │   └── violations\
│   │       ├── page.tsx (34 lines)
│   │       └── violations-page-client.tsx (181 lines)
│   ├── teacher\ (17 pages)
│   │   ├── feedback\
│   │   │   ├── [timetableEventId]\page.tsx
│   │   │   └── page.tsx (15 lines)
│   │   ├── grade-management\page.tsx (523 lines) 🔥
│   │   ├── grade-reports\
│   │   │   ├── page.tsx (26 lines)
│   │   │   ├── student\[studentId]\
│   │   │   │   ├── page.tsx
│   │   │   │   └── teacher-student-grade-detail-client.tsx
│   │   │   └── teacher-grade-reports-client.tsx (428 lines)
│   │   ├── homeroom-grades\page.tsx (514 lines) 🔥
│   │   ├── homeroom-students\page.tsx (352 lines)
│   │   ├── leave-requests\page.tsx (381 lines)
│   │   ├── loading.tsx (33 lines)
│   │   ├── meetings\page.tsx (15 lines)
│   │   ├── notifications\
│   │   │   ├── [id]\page.tsx
│   │   │   ├── create\page.tsx (48 lines)
│   │   │   └── page.tsx (13 lines)
│   │   ├── page.tsx (24 lines)
│   │   ├── reports\
│   │   │   ├── [studentId]\[reportPeriodId]\
│   │   │   │   ├── page.tsx
│   │   │   │   └── student-report-editor.tsx
│   │   │   ├── page.tsx (42 lines)
│   │   │   └── teacher-reports-client.tsx (520 lines) 🔥
│   │   ├── schedule\page.tsx (18 lines)
│   │   ├── teacher-weekly-dashboard.tsx (422 lines)
│   │   └── violations\
│   │       ├── page.tsx (96 lines)
│   │       └── teacher-violations-page-client.tsx (603 lines) 🔥
│   ├── parent\ (13 pages)
│   │   ├── chatbot\page.tsx (37 lines)
│   │   ├── feedback\page.tsx (37 lines)
│   │   ├── grades\
│   │   │   ├── [submissionId]\
│   │   │   │   ├── page.tsx
│   │   │   │   └── parent-grade-detail-client.tsx
│   │   │   ├── page.tsx (26 lines)
│   │   │   └── parent-grades-client.tsx (306 lines)
│   │   ├── leave-application\
│   │   │   ├── create\page.tsx (368 lines)
│   │   │   └── page.tsx (212 lines)
│   │   ├── leave-status\page.tsx (287 lines)
│   │   ├── loading.tsx (36 lines)
│   │   ├── meetings\page.tsx (37 lines)
│   │   ├── notifications\
│   │   │   ├── [id]\page.tsx
│   │   │   └── page.tsx (5 lines)
│   │   ├── page.tsx (307 lines)
│   │   ├── reports\
│   │   │   ├── page.tsx (55 lines)
│   │   │   └── parent-reports-client.tsx (874 lines) 🔥
│   │   └── violations\
│   │       ├── page.tsx (33 lines)
│   │       └── parent-violations-page-client.tsx (328 lines)
│   ├── student\ (2 pages)
│   │   ├── notifications\
│   │   │   ├── [id]\page.tsx
│   │   │   └── page.tsx (5 lines)
│   │   └── page.tsx (4 lines)
│   ├── layout.tsx (71 lines)
│   ├── loading.tsx (10 lines)
│   └── page.tsx (32 lines)
├── debug\grades\page.tsx (47 lines)
├── error.tsx (40 lines)
├── globals.css (281 lines)
├── icon.ico
├── layout.tsx (56 lines)
├── loading.tsx (44 lines)
├── not-found.tsx (29 lines)
├── page.tsx (1131 lines) 🚨 CRITICAL
├── pending-approval\page.tsx (16 lines)
├── profile\
│   ├── loading.tsx (68 lines)
│   └── page.tsx (353 lines)
├── providers.tsx (39 lines)
└── student\ (7 pages)
    ├── (components)\
    │   ├── animated-stats-grid.tsx (54 lines)
    │   └── student-nav.tsx (99 lines)
    ├── assignments\page.tsx (3 lines)
    ├── courses\page.tsx (3 lines)
    ├── grade-improvement\
    │   ├── page.tsx (9 lines)
    │   └── student-grade-improvement-client.tsx (532 lines) 🔥
    ├── grades\
    │   ├── page.tsx (9 lines)
    │   └── student-grades-client.tsx (535 lines) 🔥
    ├── layout.tsx (36 lines)
    ├── loading.tsx (66 lines)
    ├── notifications\page.tsx (5 lines)
    ├── page.tsx (149 lines)
    └── timetable\
        ├── page.tsx (9 lines)
        └── student-timetable-client.tsx (54 lines)
```

### **⚙️ FEATURES DIRECTORY (165 files)**
```
📁 src\features\
├── admin-management\ (47 components, 4 actions)
│   ├── actions\
│   │   ├── academic-actions.ts (544 lines) 🔥
│   │   ├── class-actions.ts (924 lines) 🚨
│   │   ├── classroom-actions.ts (195 lines)
│   │   └── user-actions.ts (871 lines) 🚨
│   ├── components\admin\
│   │   ├── academic-delete-dialog.tsx (92 lines)
│   │   ├── academic-edit-dialog.tsx (172 lines)
│   │   ├── academic-table.tsx (318 lines)
│   │   ├── academic-year-form.tsx (237 lines)
│   │   ├── academic-year-management-dialog.tsx (386 lines)
│   │   ├── academic-year-selector.tsx (154 lines)
│   │   ├── admin-student-grade-table.tsx (138 lines)
│   │   ├── class-detail\
│   │   │   ├── class-homeroom-tab.tsx (318 lines)
│   │   │   ├── class-students-tab.tsx (269 lines)
│   │   │   └── class-teachers-tab.tsx (374 lines)
│   │   ├── class-form.tsx (503 lines) 🔥
│   │   ├── classroom-delete-dialog.tsx (87 lines)
│   │   ├── classroom-edit-dialog.tsx (211 lines)
│   │   ├── classroom-form.tsx (282 lines)
│   │   ├── classroom-table.tsx (358 lines)
│   │   ├── class-table.tsx (327 lines)
│   │   ├── email-suggestion-input.tsx (218 lines)
│   │   ├── exchange-requests-management.tsx (305 lines)
│   │   ├── grade-period-form.tsx (269 lines)
│   │   ├── grade-period-status-dialog.tsx (114 lines)
│   │   ├── grade-period-table.tsx (135 lines)
│   │   ├── report-periods\
│   │   │   ├── class-progress-table.tsx (266 lines)
│   │   │   └── report-period-form.tsx (412 lines)
│   │   ├── semester-form.tsx (274 lines)
│   │   ├── student-assignment-form.tsx (276 lines)
│   │   ├── student-parent-form.tsx (535 lines) 🔥
│   │   ├── teacher-assignment-form.tsx (301 lines)
│   │   ├── teacher-assignment-form-fields.tsx (209 lines)
│   │   ├── teacher-assignment-table.tsx (216 lines)
│   │   ├── teacher-form.tsx (241 lines)
│   │   ├── time-slot-picker.tsx (170 lines)
│   │   ├── timetable-event-form.tsx (543 lines) 🔥
│   │   ├── user-table.tsx (267 lines)
│   │   └── violations\
│   │       ├── disciplinary-management.tsx (475 lines)
│   │       ├── disciplinary-processing.tsx (743 lines) 🔥
│   │       ├── monthly-report.tsx (420 lines)
│   │       ├── monthly-violation-summary.tsx (322 lines)
│   │       ├── simple-violations-table.tsx (500 lines) 🔥
│   │       ├── violation-alert-badge.tsx (8 lines)
│   │       ├── violation-categories-manager.tsx (719 lines) 🔥
│   │       ├── violation-record-form.tsx (571 lines) 🔥
│   │       ├── weekly-report.tsx (406 lines)
│   │       └── weekly-violation-reports.tsx (411 lines)
│   ├── components\subjects\
│   │   ├── subject-create-dialog.tsx (71 lines)
│   │   ├── subject-delete-dialog.tsx (100 lines)
│   │   ├── subject-edit-dialog.tsx (76 lines)
│   │   └── subject-form.tsx (175 lines)
│   ├── index.ts (16 lines)
│   └── README.md (25 lines)
├── authentication\ (4 components, 0 actions)
│   ├── components\
│   │   ├── auth\
│   │   │   ├── auth-modal.tsx (247 lines)
│   │   │   └── google-oauth-button.tsx (61 lines)
│   │   └── profile\
│   │       ├── avatar-editor.tsx (307 lines)
│   │       └── avatar-upload.tsx (110 lines)
│   ├── hooks\use-auth.ts (156 lines)
│   ├── index.ts (7 lines)
│   └── README.md (23 lines)
├── grade-management\ (6 components, 6 actions)
│   ├── actions\
│   │   ├── admin-grade-tracking-actions.ts (736 lines) 🔥
│   │   ├── detailed-grade-actions.ts (1038 lines) 🚨
│   │   ├── enhanced-grade-actions.ts (688 lines) 🔥
│   │   ├── homeroom-feedback-actions.ts (192 lines)
│   │   ├── homeroom-grade-actions.ts (411 lines)
│   │   └── homeroom-student-actions.ts (162 lines)
│   ├── components\
│   │   ├── homeroom\
│   │   │   ├── homeroom-student-card.tsx (105 lines)
│   │   │   └── homeroom-student-detail.tsx (304 lines)
│   │   └── homeroom-feedback\
│   │       ├── homeroom-feedback-dashboard.tsx (218 lines)
│   │       ├── homeroom-feedback-filters.tsx (56 lines)
│   │       ├── student-day-modal.tsx (559 lines) 🔥
│   │       └── student-weekly-grid.tsx (176 lines)
│   ├── hooks\use-homeroom-teacher.ts (36 lines)
│   ├── index.ts (13 lines)
│   └── README.md (52 lines)
├── meetings\ (1 component, 1 action)
│   ├── actions\meeting-actions.ts (545 lines) 🔥
│   ├── components\teacher-meetings\teacher-meetings-page.tsx (293 lines)
│   ├── index.ts (14 lines)
│   └── README.md (32 lines)
├── notifications\ (3 components, 1 action)
│   ├── actions\notification-actions.ts (734 lines) 🔥
│   ├── components\notifications\
│   │   ├── notification-badge.tsx (64 lines)
│   │   ├── notification-configs.ts (32 lines)
│   │   ├── notification-form.tsx (480 lines)
│   │   └── shared-notifications-page.tsx (382 lines)
│   ├── hooks\use-notification-count.ts (78 lines)
│   ├── index.ts (8 lines)
│   └── README.md (46 lines)
├── parent-dashboard\ (7 components, 1 action)
│   ├── actions\parent-actions.ts (237 lines)
│   ├── components\
│   │   ├── parent-chatbot\
│   │   │   ├── chat-history-sidebar.tsx (326 lines)
│   │   │   ├── chat-utils.ts (206 lines)
│   │   │   ├── feedback-dialog.tsx (208 lines)
│   │   │   ├── full-page-chatbot.tsx (436 lines)
│   │   │   ├── parent-chatbot.tsx (733 lines) 🔥
│   │   │   └── useChatStreaming.ts (140 lines)
│   │   ├── parent-dashboard\
│   │   │   ├── parent-grade-view-dialog.tsx (253 lines)
│   │   │   └── parent-meeting-schedules.tsx (342 lines)
│   │   └── parent-feedback\parent-feedback-dashboard.tsx (578 lines) 🔥
│   ├── index.ts (18 lines)
│   └── README.md (40 lines)
├── reports\ (0 components, 1 action)
│   ├── actions\student-report-actions.ts (698 lines) 🔥
│   ├── index.ts (15 lines)
│   └── README.md (38 lines)
├── student-management\ (0 components, 1 action)
│   ├── actions\student-assignment-actions.ts (334 lines)
│   ├── index.ts (14 lines)
│   └── README.md (37 lines)
├── teacher-management\ (10 components, 6 actions)
│   ├── actions\
│   │   ├── schedule-exchange-actions.ts (360 lines)
│   │   ├── teacher-assignment-actions.ts (285 lines)
│   │   ├── teacher-feedback-actions.ts (517 lines) 🔥
│   │   ├── teacher-grade-import-actions.ts (447 lines)
│   │   ├── teacher-grade-submission-actions.ts (196 lines)
│   │   └── teacher-schedule-actions.ts (499 lines)
│   ├── components\
│   │   ├── feedback\teacher-feedback-form.tsx (786 lines) 🔥
│   │   ├── schedule-exchange\
│   │   │   ├── exchange-request-form.tsx (319 lines)
│   │   │   └── exchange-requests-list.tsx (277 lines)
│   │   └── teacher\
│   │       ├── grade-override-reason-dialog.tsx (160 lines)
│   │       ├── reports\student-report-modal.tsx (804 lines) 🔥
│   │       ├── teacher-grade-history-dialog.tsx (157 lines)
│   │       ├── teacher-grade-import-dialog.tsx (524 lines) 🔥
│   │       ├── teacher-grade-submission-dialog.tsx (112 lines)
│   │       ├── teacher-grade-tracking-dialog.tsx (624 lines) 🔥
│   │       └── violations\teacher-disciplinary-cases.tsx (290 lines)
│   ├── index.ts (27 lines)
│   ├── README.md (50 lines)
│   └── types\teacher-grade-types.ts (45 lines)
├── timetable\ (22 components, 2 actions)
│   ├── actions\
│   │   ├── student-timetable-actions.ts (304 lines)
│   │   └── timetable-actions.ts (393 lines)
│   ├── components\
│   │   ├── calendar\
│   │   │   ├── index.ts (3 lines)
│   │   │   └── mappers.ts (105 lines)
│   │   ├── event-calendar\
│   │   │   ├── agenda-view.tsx (81 lines)
│   │   │   ├── calendar-context.tsx (59 lines)
│   │   │   ├── calendar-dnd-context.tsx (393 lines)
│   │   │   ├── constants.ts (13 lines)
│   │   │   ├── day-view.tsx (295 lines)
│   │   │   ├── draggable-event.tsx (130 lines)
│   │   │   ├── droppable-cell.tsx (67 lines)
│   │   │   ├── event-calendar.tsx (360 lines)
│   │   │   ├── event-dialog.tsx (434 lines)
│   │   │   ├── event-item.tsx (298 lines)
│   │   │   ├── hooks\
│   │   │   │   ├── use-current-time-indicator.ts (45 lines)
│   │   │   │   └── use-event-visibility.ts (72 lines)
│   │   │   ├── index.ts (20 lines)
│   │   │   ├── month-view.tsx (264 lines)
│   │   │   ├── types.ts (23 lines)
│   │   │   ├── utils.ts (225 lines)
│   │   │   └── week-view.tsx (228 lines)
│   │   ├── status-legend.tsx (57 lines)
│   │   ├── teacher-schedule-big-calendar.tsx (322 lines)
│   │   ├── teacher-timetable\
│   │   │   ├── homeroom-meeting-dialog.tsx (349 lines)
│   │   │   ├── teacher-feedback-dialog.tsx (374 lines)
│   │   │   ├── teacher-timetable-calendar.tsx (339 lines)
│   │   │   ├── teacher-timetable-event-dialog.tsx (259 lines)
│   │   │   └── teacher-timetable-filters.tsx (81 lines)
│   │   ├── timetable-big-calendar.tsx (437 lines)
│   │   └── timetable-calendar\
│   │       ├── data-mappers.ts (151 lines)
│   │       ├── study-slot-dialog.tsx (448 lines)
│   │       ├── timetable-calendar.tsx (470 lines)
│   │       └── timetable-filters.tsx (414 lines)
│   ├── hooks\use-calendar-navigation.ts (55 lines)
│   ├── index.ts (11 lines)
│   ├── README.md (53 lines)
│   └── utils\
│       ├── feedback-status.ts (124 lines)
│       └── status-indicators.ts (105 lines)
└── violations\ (0 components, 1 action)
    ├── actions\violation-actions.ts (1319 lines) 🚨 CRITICAL
    ├── index.ts (15 lines)
    └── README.md (46 lines)
```
