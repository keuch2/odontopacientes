# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OdontoPacientes is a dental patient management system for university students. It's a monorepo with three components: a Laravel API backend, a React Native (Expo) mobile app, and a React (Vite) web admin dashboard. Language throughout the codebase and UI is Spanish.

---

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

### Build & Deploy
```bash
pnpm build:web        # Build web admin
pnpm build:mobile     # Build mobile app

# Deploy mobile app (OTA update via EAS):
cd mobile-app
eas update --branch preview --message "description of changes"
# .env must point to production API before running this

# Deploy backend (pull on production server):
# See "Production Server" section below
```

### Type Generation
```bash
pnpm gen:types        # Generate TypeScript types from OpenAPI spec
```

---

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

**Demo/Fallback Auth (`DemoUserFactory`):** The production backend uses a custom `DemoUserFactory` (`backend/app/Support/DemoUserFactory.php`) as an auth fallback. It decodes a Base64-encoded email from the Bearer token and looks up the user in DB (or falls back to hardcoded demo users). This means tokens are NOT standard Sanctum tokens — they are Base64-encoded email strings with an `DEMO_` prefix. Controllers that need the current user call `$request->attributes->get('demo_user')` (set by a middleware), with a fallback `try/catch` block that re-parses the token manually.

### API Client
- **Mobile:** `mobile-app/src/lib/api.ts` — canonical API client (note: `src/services/api.ts` is a deprecated duplicate, avoid using it)
- **Web:** `web-admin/src/lib/api.ts`
- Base URL resolved dynamically: production uses `https://codexpy.com/odontopacientes/api`, dev uses localhost

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
`disponible` → `proceso` → `finalizado` (or `contraindicado` or `ausente`)

### Assignment Status Flow
`activa` → `completada` (or `abandonada`)

---

## Critical Constraints

**Never modify these Expo/RN versions** — the app must work in Expo Go (EAS preview build) without native builds:
```
expo: ~54.0.0
react: 19.1.0
react-native: 0.81.5
```

If a feature requires a different version, use polyfills, alternative libraries, or custom implementations instead.

---

## Production Server

- **URL:** `https://codexpy.com/odontopacientes/`
- **API base:** `https://codexpy.com/odontopacientes/api`
- **SSH:** `ssh -p5221 root@200.58.105.211`
- **SSH password:** stored in team password manager (use `python3 subprocess` to avoid shell escaping issues with special chars)
- **PHP CLI for artisan:** `/opt/php8-3/bin/php-cli` (NOT `/opt/php8-3/bin/php` which is CGI mode)
- **Backend path on server:** `/home/codexpy/odontopacientes/backend`
- **Repo path on server:** `/home/codexpy/odontopacientes`

### Deploying backend to production
```bash
# 1. Commit and push to main
git push origin main

# 2. SSH and pull (use python3 subprocess to avoid shell escaping issues with password):
python3 -c "
import subprocess
subprocess.run(
    ['sshpass', '-p', 'PASSWORD', 'ssh', '-p5221',
     '-o', 'StrictHostKeyChecking=no', '-o', 'PubkeyAuthentication=no',
     'root@200.58.105.211',
     'cd /home/codexpy/odontopacientes && git pull origin main'],
    timeout=30
)
"

# 3. If migrations needed:
# /opt/php8-3/bin/php-cli artisan migrate --force
```

### Deploying mobile app (OTA update)
```bash
cd mobile-app
# Verify .env has production API URL:
# EXPO_PUBLIC_API_URL=https://codexpy.com/odontopacientes/api
eas update --branch preview --message "description"
```

---

## Test Users
- **Admin:** `admin@demo.test` / `password`
- **Coordinador:** `coordinador@demo.test` / `password`
- **Alumno:** `alumno@demo.test` / `password`
- **Admisión:** `admision@demo.test` / `password`

---

## Environment Files
- `mobile-app/.env` — `EXPO_PUBLIC_API_URL` (must point to production for EAS updates)
- `mobile-app/app.config.js` — dynamic config with `getApiUrl()` for dev/preview/prod
- `backend/.env` — DB credentials, Sanctum config, CORS domains
- `web-admin/.env.local` — `VITE_API_URL`

---

## Package Manager
pnpm 9+ with workspaces. The mobile-app is NOT in pnpm workspaces (uses npm/npx directly). Use `npm install --legacy-peer-deps` when adding mobile dependencies.

---

## Known Issues & Fixes Applied (as of March 2026)

### Backend — `PatientController@index` (`backend/app/Http/Controllers/Api/PatientController.php`)
- **`tooth_fdi` search:** Filters via `whereHas('patientProcedures', fn => where('tooth_fdi', $fdi))` — uses the actual DB column, not the accessor `tooth_description`.
- **`q` search:** Searches patient name AND treatment names (`whereHas('patientProcedures.treatment', fn => where('name', LIKE, ...))`).
- **`chair_id` filter:** Checks both `patient_procedures.chair_id` AND `treatment.chair_id` (some procedures have `null` chair_id and store it on the treatment).
- **`treatments` in response:** Each patient record includes a `treatments` array with unique treatment names from all their procedures. Required for frontend filtering in `ChairPatientsScreen`.

### Backend — `AssignmentsController` (`backend/app/Http/Controllers/Api/AssignmentsController.php`)
- **Intermittent auth failures:** `myAssignments()` and `show()` now wrap token parsing in `try/catch`. They attempt `$request->attributes->get('demo_user')` first, then fall back to manually decoding the Bearer token. Role check expanded to include `admin` and `coordinador` (not just `alumno`).

### Mobile — `AssignmentDetailScreen` — DateTimePicker
- **Problem:** `@react-native-community/datetimepicker` renders inline when placed inside a React Native `Modal`, blocking the UI on iOS.
- **Fix:** Removed `DateTimePicker` from inside session modals. On iOS, renders a dedicated bottom-sheet `Modal` with `display="spinner"`. On Android, renders outside modals with `display="default"`.

### Mobile — Subclass labels in procedure lists
- `PatientDetailScreen`: `allProcedures` memo now includes `subclass: proc.treatment_subclass?.name`. Rendered as a turquoise caption below treatment name.
- `ProcedureHistoryScreen`: `Assignment` interface extended with `treatment_subclass` and `treatment_subclass_option` fields. Rendered below treatment name in history cards.
- `ProcedureViewScreen`: Already showed subclass via `procedure.treatment_subclass.name`.
- `MyPatientsScreen`: Already showed subclass.

### Mobile — "Marcar como Ausente" in `AddProcedureModal`
- When wisdom teeth (18, 28, 38, 48) are among the selected teeth, a gray **"Marcar como Ausente"** button appears above the procedure form.
- Tapping it calls `api.procedures.createForPatient` with `{ tooth_fdi, status: 'ausente', notes: 'Diente ausente' }` — no treatment selection required.
- Dismisses the modal and calls `onSuccess()` on completion.

### Mobile — Treatment filters in `ChairPatientsScreen`
- **Problem:** Frontend filter `patient.treatments.includes(name)` was always empty because the API didn't return per-patient treatment data.
- **Fix:** Backend now returns `treatments: [{name: string}]` per patient. Frontend maps this at line 69 of `ChairPatientsScreen.tsx`.

### Mobile — `ProcedureHistoryScreen` error handling
- Added `retry: 2` to the React Query config so transient auth failures auto-retry before showing an error.

---

## Data Model Notes

### `PatientProcedure`
Key columns: `patient_id`, `treatment_id`, `treatment_subclass_id`, `treatment_subclass_option_id`, `chair_id`, `tooth_fdi`, `tooth_surface`, `status`, `notes`, `sessions_total`, `sessions_completed`.

The `tooth_description` field is a **computed accessor** (not a DB column) — it combines `tooth_fdi` and `tooth_surface` into a human-readable string. Always filter by the `tooth_fdi` column directly.

### Odontogram
Each patient has one `Odontogram` with multiple `OdontogramTooth` entries (one per tooth). Each tooth has `tooth_fdi` (FDI notation integer) and `status` (sano, caries, endodoncia, ausente, etc.).

Wisdom teeth FDI numbers: **18, 28, 38, 48**.

### Treatment Subclasses
Treatments can have optional `TreatmentSubclass` entries (e.g. Caries → Clase I, Clase II). Subclasses can have `TreatmentSubclassOption` children (sub-sub-classes). Always check `treatment_subclass?.name` before rendering — many procedures have no subclass.
