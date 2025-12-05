# Prompt Registry Management System

## Overview
The Prompt Registry is an admin-only feature that allows authorized users to manage AI service prompts, view their history, and restore previous versions. This system integrates with the existing authentication and UI patterns used in the application.

## Features

### 1. **View All Prompts**
- List view of all active prompts in the system
- Search functionality to filter by name, type, provider, or description
- Color-coded badges for different providers (GPT, Claude, Gemini, Universal)
- Color-coded badges for different prompt types
- Version tracking for each prompt

### 2. **Edit Prompts**
- Edit prompt content with a user-friendly dialog
- Optional description field
- Optional reason for change field (saved to history)
- Character count for content
- Validation to prevent empty content
- Automatic version increment on save

### 3. **View History**
- View all historical versions of a prompt
- See who made changes and when
- View reasons for changes
- Expandable content preview for each version
- Restore previous versions with confirmation

### 4. **Restore Previous Versions**
- Restore any historical version
- Optional reason for restoration
- Current version automatically saved to history
- Confirmation dialog before restoration

## Access Control

**Authorized Users Only**: Only users with usernames "admin", "yajas", or "abhinav" can access the Prompt Registry.

The access control is implemented at multiple levels:
1. **Route Level**: Protected by `ProtectedRoute` component
2. **Page Level**: Redirects unauthorized users to home page using `authService.isPromptRegistryAuthorized()`
3. **UI Level**: Link only visible to authorized users in Settings

The authorization logic is centralized in `authService.isPromptRegistryAuthorized()` for easy maintenance.

## File Structure

```
src/
├── lib/
│   └── prompt-api.ts                          # API service layer
├── components/
│   └── prompts/
│       ├── edit-prompt-dialog.tsx             # Edit prompt dialog
│       └── view-history-dialog.tsx            # View history dialog
└── pages/
    ├── PromptRegistry.tsx                     # Main registry page
    └── Settings.tsx                           # Updated with link
```

## API Integration

The system uses the following API endpoints (configured via `VITE_API_BASE_URL`):

### Get All Prompts
```
GET /prompts
Authorization: Bearer {token}
```

### Get Single Prompt
```
GET /prompts/{prompt_id}
Authorization: Bearer {token}
```

### Update Prompt
```
PUT /prompts/{prompt_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated prompt content...",
  "description": "Optional description",
  "reason": "Optional reason for change"
}
```

### Get Prompt History
```
GET /prompts/{prompt_id}/history
Authorization: Bearer {token}
```

### Restore Prompt Version
```
POST /prompts/{prompt_id}/restore
Authorization: Bearer {token}
Content-Type: application/json

{
  "history_id": 15,
  "reason": "Optional reason for restoration"
}
```

## TypeScript Types

### Prompt
```typescript
interface Prompt {
  id: number;
  prompt_type: string;
  provider: string;
  name: string;
  content: string;
  description: string;
  version: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}
```

### PromptHistory
```typescript
interface PromptHistory {
  id: number;
  prompt_id: number;
  prompt_type: string;
  provider: string;
  name: string;
  content: string;
  description: string;
  version: number;
  created_at: string;
  created_by: string;
  replaced_at: string;
  replaced_by: string;
  reason: string | null;
}
```

## Usage

### Accessing the Prompt Registry
1. Log in as admin user
2. Navigate to Settings
3. Click on "Prompt Registry" card
4. Or directly navigate to `/prompt-registry`

### Editing a Prompt
1. Click "Edit" button on any prompt
2. Modify the content, description (optional)
3. Add a reason for the change (optional but recommended)
4. Click "Save Changes"
5. The old version is automatically saved to history

### Viewing History
1. Click "History" button on any prompt
2. View all previous versions
3. Click "Show Content" to expand and view full content
4. See who made changes and when
5. View reasons for changes if provided

### Restoring a Version
1. Open the history dialog
2. Click "Restore" on the version you want to restore
3. Optionally add a reason for restoration
4. Confirm the restoration
5. The current version is saved to history before restoration

## Styling

The Prompt Registry follows the existing design system:
- Uses Tailwind CSS with the Vyapti Financial Theme
- Consistent with other admin pages (Activity Logs)
- Responsive design for mobile and desktop
- Uses shadcn/ui components (Dialog, Card, Button, Badge, etc.)
- Color-coded badges for visual distinction

## Error Handling

- Network errors are caught and displayed to users
- Authentication errors redirect to login
- 404 errors show appropriate messages
- All errors are logged to console for debugging
- Toast notifications for user feedback

## Future Enhancements

Potential improvements:
- Diff view between versions
- Bulk operations
- Export/import prompts
- Prompt templates
- A/B testing support
- Performance metrics per prompt version

