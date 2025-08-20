# Admin Management Feature

This feature handles all administrative functionality for the EduConnect system.

## Structure

```
admin-management/
├── actions/           # Server actions for admin operations
│   ├── academic-actions.ts
│   ├── class-actions.ts
│   ├── classroom-actions.ts
│   └── user-actions.ts
├── components/        # Admin UI components
│   ├── admin/         # Core admin components
│   └── subjects/      # Subject management components
└── index.ts          # Feature exports
```

## Components

- **Academic Management**: Academic year, semester management
- **Class Management**: Class creation, editing, student assignments
- **User Management**: Teacher, student, parent user management
- **Subject Management**: Subject creation and assignment

## Actions

- Academic year CRUD operations
- Class and classroom management
- User management and assignments
- Subject management operations
