# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
yarn install          # Install dependencies
yarn dev              # Start dev server (port 3000)
yarn build            # Production build (base path: /hyrox-squad-4/)
yarn preview          # Preview production build
yarn init-firestore   # Run scripts/importFirestore.ts to seed Firestore data
```

**Firebase deployment:**
```bash
firebase deploy --only hosting           # Deploy app
firebase deploy --only firestore:rules   # Deploy Firestore security rules
firebase deploy --only storage:rules     # Deploy Storage security rules
```

## Tech Stack

- **Frontend**: Vue 3.5 (Composition API) + TypeScript 5 (strict mode)
- **Build**: Vite 6
- **Styling**: Tailwind CSS v4 with PostCSS
- **Backend**: Firebase (Auth + Firestore + Storage)
- **Icons**: Lucide Vue Next

## Architecture Overview

### Layered Services Pattern

```
Views/Components
    ↓
Composables (state management via Composition API + Firestore listeners)
    ↓
Services
    ├── workflows/     # Complex transactions (e.g., check-in)
    ├── aggregators/   # Data fetching
    ├── calculators/   # Pure functions (e.g., streak calculation)
    ├── operations/    # CRUD for users, squads, workouts
    └── utils/         # Helpers
    ↓
Firebase (Auth, Firestore, Storage)
```

### Key Architectural Decisions

1. **User Binding System**: Separates Firebase Auth UIDs from app users (u1-u4). The `auth-bindings/{authUid}` collection maps Firebase Auth to app identities, allowing multiple login methods per user.

2. **Streak Calculation**: Computed in real-time from `users/{userId}/dailyStats/{date}` documents (not cached). Squad streak requires ANY bound member to complete (changed from requiring ALL members).

3. **State Management**: No Pinia/Vuex. Uses Vue Composition API refs + Firestore realtime listeners in composables.

4. **Check-in Workflow**: Transactional flow: upload image → create workout record → update user/squad stats → recalculate streaks.

### Core Composables

- `useAuth.ts`: Auth state, login/logout, user binding
- `useDashboard.ts`: Dashboard data loading, realtime listeners, streak updates
- `useWorkout.ts`: Check-in workflow with image upload

### Path Alias

`@/` maps to `src/` (configured in tsconfig.json and vite.config.ts)

## Firestore Structure

**Collections:**
- `squads/{squadId}` - Team info, member list
- `squads/{squadId}/members/{userId}` - Membership info
- `users/{userId}` - User profiles
- `users/{userId}/dailyStats/{date}` - Daily completion tracking
- `workouts/{workoutId}` - Training records
- `auth-bindings/{authUid}` - Firebase UID → app user mapping

## Critical: Firestore Changes

**Before modifying any Firestore structure or logic, you MUST complete the checklist in `docs/FIRESTORE_CHANGE_CHECKLIST.md`.**

This includes updating:
1. TypeScript types in `src/types/firestore.ts`
2. Firestore rules in `firestore/firestore.rules`
3. Service layer operations
4. Documentation in `docs/FIRESTORE_SCHEMA.md`

## Code Style

- camelCase for variables/functions
- PascalCase for components/types
- Conventional Commits for git messages
- TypeScript strict mode enabled
- Date strings use `YYYY-MM-DD` format; precise times use Firestore Timestamp

## Documentation

The `docs/` folder contains detailed specifications:
- `TECHNICAL_SPEC.md` - Complete system architecture (in Chinese)
- `FIRESTORE_SCHEMA.md` - Database structure and CRUD operations
- `FIRESTORE_CHANGE_CHECKLIST.md` - Mandatory checklist for DB changes
