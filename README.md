# Hyrox Squad 4

A workout tracking app for Hyrox training built with Vue, TypeScript, and Vite.

## Features

- 🗓️ **Training History Heatmap** - 80-day workout visualization like GitHub contributions
- 🔥 **Streak Tracking** - Track team consecutive check-in days
- 📊 **Team Progress Dashboard** - Real-time progress ring showing team completion (0-100%)
- 📸 **Photo Check-in** - Upload workout photos with descriptions
- 👥 **User Binding** - Link Firebase Auth to app users
- 🔐 **Secure Authentication** - Google Sign-In & Email/Password login
- ☁️ **Firebase Backend** - Auth, Firestore Database, and Storage

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript 5
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide Vue Next
- **Backend**: Firebase (Auth + Firestore + Storage)

## Documentation

📚 **Complete technical documentation is available in the [`docs/`](./docs) folder:**

- **[Technical Specification](./docs/TECHNICAL_SPEC.md)** - Complete system architecture, data models, and feature specs
- **[Firestore Schema](./docs/FIRESTORE_SCHEMA.md)** - Detailed database structure, CRUD operations, and best practices
- **[Firestore Change Checklist](./docs/FIRESTORE_CHANGE_CHECKLIST.md)** - Mandatory checklist for any Firestore modifications

## Quick Start

### Prerequisites

- Node.js 18+ and Yarn
- Firebase project with Auth, Firestore, and Storage enabled

### Installation

```bash
# Install dependencies
yarn install

# Set up Firebase config
# Copy your Firebase config to src/config/firebase.ts

# Run development server
yarn dev
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google & Email/Password providers)
3. Create Firestore database
4. Enable Storage
5. Deploy Firestore Rules and Storage Rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Project Structure

```
src/
├── components/         # Vue components
│   ├── LoginView.vue          # Login screen
│   ├── UserSelection.vue      # User binding selection
│   ├── HistoryHeatmap.vue     # Heatmap & streak display
│   ├── EnergyDashboard.vue    # Progress ring & avatars
│   ├── ActionSection.vue      # Check-in action
│   └── PhotoModal.vue         # Photo preview modal
├── composables/        # Composition API logic
│   ├── useAuth.ts             # Authentication & binding
│   ├── useDashboard.ts        # Dashboard data loading
│   └── useWorkout.ts          # Check-in workflow
├── services/           # Business logic
│   ├── auth/                  # Auth services
│   ├── firestore/             # Firestore operations
│   └── storage/               # Storage operations
├── types/              # TypeScript definitions
├── constants/          # App constants
└── config/             # Configuration files

docs/                   # Technical documentation
├── TECHNICAL_SPEC.md
├── FIRESTORE_SCHEMA.md
└── FIRESTORE_CHANGE_CHECKLIST.md

firestore/              # Firebase rules
├── firestore.rules
└── storage.rules
```

## Key Concepts

### User Binding

The app uses a binding mechanism to separate Firebase Auth UIDs from app user identities:

- Firebase Auth handles authentication (Google/Email)
- `auth-bindings` collection maps Auth UIDs to app users (`u1`, `u2`, `u3`, `u4`)
- Multiple Auth accounts can bind to the same app user

### Streak Calculation

Team streak increments when **all bound users** complete their daily check-in:

- If 3 out of 4 users are bound, only those 3 need to complete
- Missing any bound user breaks the streak
- Streak resets to 0 if broken, restarts at 1 next day

### Firestore Structure

Main collections:
- `squads/{squadId}` - Team information
- `users/{userId}` - User profiles
- `workouts/{workoutId}` - Training records
- `auth-bindings/{authUid}` - Auth UID to app user mapping

See [Firestore Schema](./docs/FIRESTORE_SCHEMA.md) for detailed documentation.

## Development Guidelines

### Before Modifying Firestore

⚠️ **IMPORTANT**: Any Firestore structure or logic changes MUST complete the [Firestore Change Checklist](./docs/FIRESTORE_CHANGE_CHECKLIST.md)

This ensures:
- ✅ Data consistency
- ✅ Security rules are updated
- ✅ Code and database stay in sync
- ✅ Documentation is maintained

### Code Standards

- Use TypeScript strict mode
- Follow Vue 3 Composition API best practices
- Use camelCase for variables and functions
- Use PascalCase for components and types
- Add JSDoc comments for complex logic

## Deployment

```bash
# Build for production
yarn build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

## Contributing

1. Read the [Technical Specification](./docs/TECHNICAL_SPEC.md)
2. Check the [Firestore Change Checklist](./docs/FIRESTORE_CHANGE_CHECKLIST.md) before database changes
3. Follow the project's code standards
4. Write meaningful commit messages (Conventional Commits)
5. Update documentation when adding features

## License

This project is for internal use by Hyrox Squad 4 team members.

## Support

For questions or issues, please refer to:
- [Technical Specification](./docs/TECHNICAL_SPEC.md) - Complete system documentation
- [Firestore Schema](./docs/FIRESTORE_SCHEMA.md) - Database structure and operations
