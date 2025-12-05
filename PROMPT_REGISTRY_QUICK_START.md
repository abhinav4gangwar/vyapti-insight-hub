# Prompt Registry - Quick Start Guide

## 🎯 What Was Built

A complete prompt management system for your AI service with:
- ✅ View all prompts with search functionality
- ✅ Edit prompts with version tracking
- ✅ View complete history of changes
- ✅ Restore previous versions
- ✅ Admin-only access control
- ✅ Consistent with existing UI/UX patterns

## 📁 Files Created

1. **`src/lib/prompt-api.ts`** - API service layer with all prompt endpoints
2. **`src/components/prompts/edit-prompt-dialog.tsx`** - Dialog for editing prompts
3. **`src/components/prompts/view-history-dialog.tsx`** - Dialog for viewing/restoring history
4. **`src/pages/PromptRegistry.tsx`** - Main registry page
5. **`PROMPT_REGISTRY.md`** - Complete documentation

## 📝 Files Modified

1. **`src/App.tsx`** - Added `/prompt-registry` route
2. **`src/pages/Settings.tsx`** - Added Prompt Registry card for admin users

## 🚀 How to Access

### For Authorized Users:
1. Login as one of the authorized users (admin, yajas, or abhinav)
2. Go to **Settings** page
3. Click on **"Prompt Registry"** card (green icon)
4. Or navigate directly to `/prompt-registry`

### Access Control:
- Only users with usernames: **admin**, **yajas**, or **abhinav** can access
- Authorization check is centralized in `authService.isPromptRegistryAuthorized()`
- Unauthorized users are redirected to home page

## 🎨 UI Features

### Main Page (`/prompt-registry`)
```
┌─────────────────────────────────────────────────────┐
│ Prompt Registry                                     │
│ Manage AI service prompts and their versions        │
├─────────────────────────────────────────────────────┤
│ 🔍 Search by name, type, provider, or description   │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ answer_llm_default  [v3] [GPT] [DEFAULT_SYSTEM]│ │
│ │ Default answer system prompt for gpt            │ │
│ │ ID: 1 • Updated: 1/20/2024 • By: john_doe       │ │
│ │                          [History] [Edit]       │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ answer_llm_default [v2] [CLAUDE] [DEFAULT_SYS] │ │
│ │ Default answer system prompt for claude         │ │
│ │ ID: 2 • Updated: 1/18/2024 • By: jane_smith     │ │
│ │                          [History] [Edit]       │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Edit Dialog
```
┌─────────────────────────────────────────────────────┐
│ Edit Prompt                                    [v3] │
├─────────────────────────────────────────────────────┤
│ Type: DEFAULT_SYSTEM    Provider: GPT               │
│ Name: answer_llm_default                            │
├─────────────────────────────────────────────────────┤
│ Description (Optional)                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Brief description of this prompt                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Prompt Content *                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ You are a helpful AI assistant...               │ │
│ │                                                 │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ 1,234 characters                                    │
│                                                     │
│ Reason for Change (Optional)                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Improved clarity and added context handling     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│                          [Cancel] [Save Changes]    │
└─────────────────────────────────────────────────────┘
```

### History Dialog
```
┌─────────────────────────────────────────────────────┐
│ Prompt History                                      │
│ DEFAULT_SYSTEM - GPT - answer_llm_default           │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ [v3] 📅 Replaced on 1/21/2024 4:30 PM           │ │
│ │      👤 By current_user                         │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Reason: Improved clarity and added context  │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │ [Show Content]                      [Restore]   │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [v2] 📅 Replaced on 1/20/2024 2:45 PM           │ │
│ │      👤 By john_doe                             │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Reason: Fixed formatting issues             │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │ [Show Content]                      [Restore]   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 🎨 Color Coding

### Provider Badges:
- **GPT**: Green background (`bg-green-100 text-green-800`)
- **CLAUDE**: Purple background (`bg-purple-100 text-purple-800`)
- **GEMINI**: Blue background (`bg-blue-100 text-blue-800`)
- **UNIVERSAL**: Gray background (`bg-gray-100 text-gray-800`)

### Type Badges:
- **DEFAULT_SYSTEM**: Blue (`bg-blue-100 text-blue-800`)
- **QUERY_EXPANSION**: Yellow (`bg-yellow-100 text-yellow-800`)
- **CORE_SYSTEM**: Indigo (`bg-indigo-100 text-indigo-800`)
- **WEIGHT_INSTRUCTIONS**: Orange (`bg-orange-100 text-orange-800`)
- **QUERY_EXTRACTION**: Pink (`bg-pink-100 text-pink-800`)

## 🔧 Configuration

Make sure your `.env` file has:
```bash
VITE_API_BASE_URL=http://localhost:8001
```

The API endpoints are:
- `GET /prompts` - Get all prompts
- `GET /prompts/{id}` - Get single prompt
- `PUT /prompts/{id}` - Update prompt
- `GET /prompts/{id}/history` - Get history
- `POST /prompts/{id}/restore` - Restore version

## 📊 Prompt Types in System

Based on your data, the system manages these prompts:

| ID | Type | Provider | Name | Description |
|----|------|----------|------|-------------|
| 1 | DEFAULT_SYSTEM | GPT | answer_llm_default | Default answer system prompt for gpt |
| 2 | DEFAULT_SYSTEM | CLAUDE | answer_llm_default | Default answer system prompt for claude |
| 3 | DEFAULT_SYSTEM | GEMINI | answer_llm_default | Default answer system prompt for gemini |
| 4 | QUERY_EXPANSION | GPT | query_expansion_system | Query expansion system prompt for gpt |
| 5 | QUERY_EXPANSION | CLAUDE | query_expansion_system | Query expansion system prompt for claude |
| 6 | QUERY_EXPANSION | GEMINI | query_expansion_system | Query expansion system prompt for gemini |
| 7 | CORE_SYSTEM | GPT | answer_llm_core | Core reference formatting for GPT |
| 8 | CORE_SYSTEM | CLAUDE | answer_llm_core | Core reference formatting for Claude |
| 9 | CORE_SYSTEM | GEMINI | answer_llm_core | Core reference formatting for Gemini |
| 10 | WEIGHT_INSTRUCTIONS | UNIVERSAL | weight_prioritization | Weight-based prioritization |
| 11 | QUERY_EXTRACTION | UNIVERSAL | query_extraction_disabled | Query extraction template |

## ✅ Testing Checklist

- [ ] Login as admin user
- [ ] Navigate to Settings
- [ ] See "Prompt Registry" card
- [ ] Click to open Prompt Registry
- [ ] See list of all prompts
- [ ] Use search to filter prompts
- [ ] Click "Edit" on a prompt
- [ ] Modify content and save
- [ ] Click "History" on a prompt
- [ ] View previous versions
- [ ] Expand content of a historical version
- [ ] Restore a previous version
- [ ] Verify version increments correctly

## 🚨 Important Notes

1. **Admin Only**: Only admin users can access this feature
2. **Version Tracking**: Every edit creates a new version
3. **History Preserved**: Old versions are never deleted
4. **Reason Field**: Optional but recommended for tracking changes
5. **Authentication**: Uses existing auth system with Bearer tokens

