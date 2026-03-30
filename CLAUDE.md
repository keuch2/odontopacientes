# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OdontoPacientes is a dental patient management system for university students. It's a monorepo with three components: a Laravel API backend, a React Native (Expo) mobile app, and a React (Vite) web admin dashboard. Language throughout the codebase and UI is Spanish.

## Common Commands

### Development
```bash
pnpm dev              # Start web-admin and mobile-app in parallel
pnpm dev:web          # Web admin only (port 5173)
pnpm dev:mobile       # Mobile app only (Expo)
```

### Backend (Laravel)
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000   # Dev server
php artisan migrate --seed                       # Run migrations + seeders
php artisan migrate:status                       # Check migration status
composer install                                 # Install PHP dependencies
```

### Mobile App
```bash
cd mobile-app
npx expo start        # Start Expo dev server
npm run ios           # iOS simulator
npm run android       # Android emulator
```

### Code Quality
```bash
pnpm lint             # ESLint across all workspaces
pnpm format           # Prettier across the project
```

### Build
```bash
pnpm build:web        # Build web admin
pnpm build:mobile     # Build mobile app
```

### Type Generation
```bash
pnpm gen:types        # Generate TypeScript types from OpenAPI spec
```

## Architecture

### Monorepo Layout
- **`backend/`** — Laravel 11 REST API (PHP 8.3, MySQL, Sanctum auth)
- **`mobile-app/`** — React Native + Expo 54 (TypeScript, React Native Paper / MD3)
- **`web-admin/`** — React 18 + Vite (TypeScript, Tailwind CSS)
- **`shared/`** — OpenAPI specs and shared TypeScript types

### State Management (both frontends)
- **Server state:** `@tanstack/react-query` for API data fetching/caching
- **Client state:** `zustand` with persist middleware (AsyncStorage on mobile, localStorage on web)
- Auth stores: `mobile-app/src/store/auth.ts`, `web-admin/src/store/auth.ts`

### Authentication Flow
Sanctum Bearer tokens (stateless). Login returns `{user, access_token}`, stored in Zustand. Axios interceptors attach `Authorization: Bearer {token}` to all requests. 401 responses trigger automatic logout.

### API Client
- **Mobile:** `mobile-app/src/lib/api.ts` — canonical API client (note: `src/services/api.ts` is a deprecated duplicate)
- **Web:** `web-admin/src/lib/api.ts`
- Base URL resolved dynamically: production uses `codexpy.com`, dev uses localhost

### Navigation (Mobile)
Bottom tab navigator with 5 tabs, each containing a stack navigator:
1. Cátedras → ChairPatients → PatientDetail
2. MyPatients → AssignmentDetail → Odontogram
3. Add → CreatePatient → Odontogram
4. Notifications → NotificationPreferences
5. Settings

### Backend Models (key entities)
University → Faculty → Chair → Treatment (academic hierarchy). Patient → PatientProcedure → Assignment (clinical workflow). User has roles: admin, coordinador, admision, alumno.

### Procedure Status Flow
`disponible` → `proceso` → `finalizado` (or `contraindicado`)

### Assignment Status Flow
`activa` → `completada` (or `abandonada`)

## Critical Constraints

**Never modify these Expo/RN versions** — the app must work in Expo Go without native builds:
```
expo: ~54.0.0
react: 19.1.0
react-native: 0.81.5
```

If a feature requires a different version, use polyfills, alternative libraries, or custom implementations instead.

## Test Users
- Admin: `admin@demo.test` / `password`
- Student: `alumno@demo.test` / `password`

## Environment Files
- `mobile-app/.env` — `EXPO_PUBLIC_API_URL`
- `mobile-app/app.config.js` — dynamic config with `getApiUrl()` for dev/preview/prod
- `backend/.env` — DB credentials, Sanctum config, CORS domains
- `web-admin/.env.local` — `VITE_API_URL`

## Package Manager
pnpm 9+ with workspaces. The mobile-app is NOT in pnpm workspaces (uses npm/npx directly). Use `npm install --legacy-peer-deps` when adding mobile dependencies.
