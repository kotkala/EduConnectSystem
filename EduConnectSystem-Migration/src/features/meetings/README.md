# Meetings Feature

This feature handles meeting scheduling and management for teachers and parents.

## Structure

```
meetings/
├── components/        # Meeting UI components
│   └── teacher-meetings/  # Teacher meeting components
├── actions/           # Server actions for meeting operations (to be created)
├── hooks/             # Meeting-related hooks (to be created)
├── types/             # TypeScript types (to be created)
├── utils/             # Meeting utility functions (to be created)
├── constants/         # Meeting constants (to be created)
└── index.ts          # Feature exports
```

## Components

- **Teacher Meetings Calendar**: Calendar view for teacher meetings
- **Teacher Meetings Form**: Form for creating/editing meetings

## Features

- Meeting scheduling
- Calendar integration
- Teacher-parent meeting coordination
- Meeting notifications

## Usage

```typescript
import { TeacherMeetingsCalendar } from '@/features/meetings'
```

## Development Status

- ✅ Basic components created
- ⏳ Actions layer (pending)
- ⏳ Hooks layer (pending)
- ⏳ Types definitions (pending)
- ⏳ Utilities (pending)
