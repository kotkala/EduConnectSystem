# Authentication Feature

This feature handles user authentication, authorization, and profile management.

## Structure

```
authentication/
├── components/        # Auth UI components
│   ├── auth/          # Login/signup components
│   └── profile/       # Profile management components
├── hooks/             # Auth-related hooks
│   └── use-auth.ts    # Main auth hook
└── index.ts          # Feature exports
```

## Components

- **Auth Modal**: Login/signup modal
- **Google OAuth**: Google authentication button
- **Profile Management**: Avatar editor, profile updates

## Hooks

- **useAuth**: Main authentication hook for user state management

## Features

- Google OAuth integration
- Profile picture upload and editing
- User session management
- Role-based access control
