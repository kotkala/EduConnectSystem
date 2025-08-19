# Timetable Feature

This feature handles timetable management, calendar integration, and schedule visualization.

## Structure

```
timetable/
├── actions/           # Server actions for timetable operations
│   └── timetable-actions.ts
├── components/        # Timetable UI components
│   ├── calendar/      # Calendar components
│   ├── event-calendar/  # Event calendar components
│   ├── teacher-schedule-big-calendar.tsx
│   ├── teacher-timetable/  # Teacher timetable components
│   ├── timetable-big-calendar.tsx
│   └── timetable-calendar/  # Timetable calendar components
├── hooks/             # Timetable-specific hooks
│   └── use-calendar-navigation.ts
├── types/             # TypeScript types (to be created)
├── utils/             # Timetable utility functions (to be created)
├── constants/         # Timetable constants (to be created)
└── index.ts          # Feature exports
```

## Components

- **Event Calendar**: Calendar with event management
- **Teacher Schedule**: Big calendar view for teachers
- **Timetable Calendar**: General timetable calendar
- **Teacher Timetable**: Teacher-specific timetable views

## Hooks

- **useCalendarNavigation**: Calendar navigation functionality

## Actions

- Timetable CRUD operations
- Schedule management
- Event handling
- Calendar synchronization

## Features

- Interactive calendar views
- Teacher schedule management
- Event scheduling
- Timetable visualization
- Calendar navigation

## Usage

```typescript
import { 
  EventCalendar,
  TeacherTimetableCalendar,
  useCalendarNavigation 
} from '@/features/timetable'
```

## Development Status

- ✅ Components created
- ✅ Actions layer implemented
- ✅ Hooks layer implemented
- ⏳ Types definitions (pending)
- ⏳ Utilities (pending)
