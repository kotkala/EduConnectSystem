# Notifications Feature

This feature handles the notification system including badges, forms, and notification management.

## Structure

```
notifications/
├── actions/           # Server actions for notification operations
│   └── notification-actions.ts
├── components/        # Notification UI components
│   └── notifications/  # Notification components
├── hooks/             # Notification-specific hooks
│   └── use-notification-count.ts
├── types/             # TypeScript types (to be created)
├── utils/             # Notification utility functions (to be created)
├── constants/         # Notification constants (to be created)
└── index.ts          # Feature exports
```

## Components

- **Notification Badge**: Badge showing notification count
- **Notification Form**: Form for creating notifications
- **Shared Notifications Page**: Shared notification interface

## Hooks

- **useNotificationCount**: Hook for managing notification counts

## Actions

- Notification CRUD operations
- Notification delivery
- Read/unread status management
- Notification preferences

## Features

- Real-time notifications
- Notification badges
- Notification management
- User preferences
- Notification history

## Usage

```typescript
import { 
  NotificationBadge,
  useNotificationCount 
} from '@/features/notifications'
```

## Development Status

- ✅ Components created
- ✅ Actions layer implemented
- ✅ Hooks layer implemented
- ⏳ Types definitions (pending)
- ⏳ Utilities (pending)
