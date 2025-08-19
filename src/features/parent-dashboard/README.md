# Parent Dashboard Feature

This feature provides the main dashboard interface for parents to monitor their children's academic progress.

## Structure

```
parent-dashboard/
├── actions/           # Server actions for parent operations
├── components/        # Parent dashboard UI components
│   ├── parent-dashboard/  # Main dashboard components
│   ├── parent-chatbot/    # AI chatbot for parents
│   └── parent-feedback/   # Feedback components
├── hooks/             # Parent-specific hooks (to be created)
├── types/             # TypeScript types (to be created)
├── utils/             # Parent utility functions (to be created)
├── constants/         # Parent constants (to be created)
└── index.ts          # Feature exports
```

## Components

- **Parent Dashboard**: Main dashboard with overview
- **Parent Chatbot**: AI-powered chatbot for parent queries
- **Parent Feedback**: Feedback submission and viewing

## Actions

- Parent data retrieval
- Student progress tracking
- Communication with teachers

## Features

- Student progress overview
- Grade monitoring
- AI chatbot assistance
- Feedback system
- Communication tools

## Usage

```typescript
import { ParentDashboardClient, ParentChatbotClient } from '@/features/parent-dashboard'
```

## Development Status

- ✅ Components created
- ✅ Actions layer implemented
- ⏳ Hooks layer (pending)
- ⏳ Types definitions (pending)
- ⏳ Utilities (pending)
