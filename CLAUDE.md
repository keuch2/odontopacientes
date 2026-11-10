# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OdontoPacientes is a dental patient management system for university students. It's a monorepo with four components: a Laravel API backend, a React Native (Expo) mobile app, a React (Vite) web admin dashboard, and a React (Vite) public site for registration and Premium payment. Language throughout the codebase and UI is Spanish.

---

## Common Commands

### Development
```bash
pnpm dev:public                                # Public site (port 5174)
pnpm --filter odontopacientes-web-admin dev    # Web admin (port 5173)
cd mobile-app && npx expo start                # Mobile app
```
`pnpm dev:web`, `pnpm lint:web`, `pnpm build:web` and the `*:mobile` root scripts fail with "No projects matched": they filter on `web-admin` / `mobile-app`, but the package is named `odontopacientes-web-admin` and mobile-app is not a workspace.

Locally, both web apps default to the API at `http://localhost/odontopacientes/backend/public/api` (Apache), not `artisan serve`.

### Backend (Laravel)
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000   # Dev server
php artisan migrate --seed                       # Run migrations + seeders
php artisan migrate:status                       # Check migration status
composer install                                 # Install PHP dependencies
php artisan route:list --path=api                # Inspect the API surface
vendor/bin/pint                                  # Format PHP
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
pnpm --filter odontopacientes-web-admin lint         # ESLint (web-admin only)
pnpm --filter odontopacientes-web-admin type-check   # Also available for odontopacientes-web-public
cd mobile-app && npx tsc --noEmit                    # Mobile type-check
pnpm format                                          # Prettier across the project
```
**There are no automated tests** in any component (no `backend/tests/`, no `phpunit.xml`, no JS test files), so verify changes by exercising the API or app.

The checks are not green at baseline (November 2026): `tsc` reports 3 errors in web-admin, 1 in web-public and 3 in mobile-app, web-admin ESLint reports 1 error and 62 warnings, and web-public has no ESLint config. `npm run build` is plain `vite build` and does not type-check.

### Build & Deploy
```bash
pnpm --filter odontopacientes-web-admin build   # Build web admin
pnpm build:public                                # Build public site

# Deploy mobile app (OTA update via EAS):
cd mobile-app
eas update --branch preview --message "description of changes"
# .env must point to production API before running this

# Deploy backend and web apps:
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
- **`web-public/`** — React 18 + Vite public site (registration, login, profile, Premium payment), served at `/odontopacientes/app/`
- **`shared/`** — OpenAPI specs and shared TypeScript types

Do not edit `backend-build/`, `web-admin-build/` or `mobile-app-backup/`, which are stale copies. `backend/routes/api_broken.php` and `backend/routes/test.php` are not loaded by the app.

`AGENTS.md` and `mobile-app/AGENTS.md` date from January 2026 and are partly out of date. `mobile-app/DEPLOY.md` is the App Store / Play Store release guide.

### Backend routing
`backend/routes/api.php` mixes controller routes with substantial inline closures: `/profile`, `/users` (including `PUT /users/{id}/plan`) and `/ads` live there, not in controllers. Check it before assuming an endpoint has a controller. The active auth controller is `Controllers/Api/AuthController.php`, not `Controllers/AuthController.php`.

`/users` routes are limited by `role:admin,coordinador`. Admins are unrestricted, while a coordinador can only see and manage users with role `alumno` (the web-admin Alumnos page) and can never assign another role.

### State Management (all frontends)
- **Server state:** `@tanstack/react-query` for API data fetching/caching
- **Client state:** `zustand` with persist middleware (AsyncStorage on mobile, localStorage on web)
- Auth stores: `mobile-app/src/store/auth.ts`, `web-admin/src/store/auth.ts`, `web-public/src/store/auth.ts`

### Authentication Flow
Sanctum Bearer tokens (stateless). Login returns `{user, access_token}`, stored in Zustand. Axios interceptors attach `Authorization: Bearer {token}` to all requests. 401 responses trigger automatic logout.

**The `demo_user` array:** Protected routes use the `demo.auth` middleware (`DemoAuthMiddleware`), not `auth:sanctum`. It validates the Sanctum token and stores the user as a plain array in `$request->attributes->get('demo_user')`, which is what controllers read (`$request->user()` is generally not populated). The array is built only in `DemoUserFactory::buildFromModel()`, so add new user fields there.

### Plans (Básico / Premium)
Básico is read-only and hides patient contact details. Premium has full access, and admins always pass.
- **Enforcement** lives in one place: the `plan.premium` middleware (`EnsurePremiumPlan`) on the write-route sub-group in `routes/api.php`. New write endpoints go inside that group. `apiResource('patients')` is deliberately split into read and write declarations, so never redeclare it in full.
- **Plan state:** `users.plan` and `users.plan_expires_at` (null means permanent). Expiry is resolved at read time by `User::isPremium()`, with no cron. `hasFullAccess()` feeds `demo_user.is_premium`.
- **Patient contact fields** (`phone`, `emergency_contact`, `emergency_phone`) are returned as `null` to Básico users by `PatientController@index/show`.
- **Mobile:** `useIsPremium()` in `store/auth.ts` gates write actions in the UI.
- **Payment:** Bancard vPOS, isolated in `app/Services/Bancard/BancardClient.php`, runs in stub mode until `BANCARD_PUBLIC_KEY` / `BANCARD_PRIVATE_KEY` are set. Admins can grant Premium without payment.

**App Store constraint:** the mobile app must never present Premium as a paid product or show a purchase CTA. It only shows an informational plan badge on the profile screen, and the 403 from `plan.premium` uses a neutral message with `code: plan_restriction`. Pricing and payment belong only on the web.

### API Client
- **Mobile:** `mobile-app/src/lib/api.ts` — canonical API client (note: `src/services/api.ts` is a deprecated duplicate, avoid using it)
- **Web:** `web-admin/src/lib/api.ts`, `web-public/src/lib/api.ts`
- Base URL resolved dynamically: production uses `https://codexpy.com/odontopacientes/api`, dev uses localhost
- **Mobile `.env` points at production and overrides the dev default** in `app.config.js`, so a local `expo start` hits the production API unless `EXPO_PUBLIC_API_URL` is changed. `.env.development` sets `API_URL`, which `getApiUrl()` does not read.

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
- **Web root:** Apache serves `/home/codexpy/public_html/odontopacientes/` (a stub `index.php` loads Laravel), not `backend/public/`. New static files in `backend/public/` need a symlink from the web root, or requests fall through to Laravel and return 404.
- **Web apps:** web-admin at `/odontopacientes/web-admin/`, public site at `/odontopacientes/app/`.

### `deploy.sh`
Local-only and gitignored: never commit it or copy it to the server. It reads `SSH_PASSWORD` and `DB_PASSWORD` from a private secrets file outside the repo (`ODONTO_SECRETS_FILE` overrides the path).

Options: `--backend`, `--web-admin`, `--web-public`, `--all` (backend + web-admin only), `--test`, `--ssh`, `--db-sync`.
- `--backend` and `--all` run `git add -A` and commit everything in the working tree before pushing, and run production migrations. Check `git status` first.
- `--db-sync` replaces the entire production database with the local one.

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
- `backend/config/services.php` — Premium price and duration, Bancard settings

---

## Package Manager
pnpm 9+ with workspaces. The workspaces are `web-admin` and `web-public`. The mobile-app is NOT in pnpm workspaces (uses npm/npx directly), and adding it breaks EAS Build plugin resolution. Use `npm install --legacy-peer-deps` when adding mobile dependencies.

---

## Known Issues & Fixes Applied (as of March 2026)

### Backend — `PatientController@index` (`backend/app/Http/Controllers/Api/PatientController.php`)
- **`tooth_fdi` search:** Uses `FIND_IN_SET` on the DB column, because it can hold a comma-separated list (prostheses). All clinical filters apply inside a single `whereHas`, so they must match the same procedure.
- **`q` search:** Searches patient name AND treatment names (`whereHas('patientProcedures.treatment', fn => where('name', LIKE, ...))`).
- **`chair_id` filter:** Checks both `patient_procedures.chair_id` AND `treatment.chair_id` (some procedures have `null` chair_id and store it on the treatment).
- **`treatments` in response:** Each patient record includes a `treatments` array with unique treatment names from all their procedures. Required for frontend filtering in `ChairPatientsScreen`.

### Backend — `AssignmentsController` (`backend/app/Http/Controllers/Api/AssignmentsController.php`)
- **Intermittent auth failures:** `myAssignments()` and `show()` now wrap token parsing in `try/catch`. They attempt `$request->attributes->get('demo_user')` first, then fall back to manually decoding the Bearer token. Role check expanded to include `admin` and `coordinador` (not just `alumno`).

### Mobile — `AssignmentDetailScreen` — DateTimePicker
- **Problem:** iOS does not present a second `Modal` while another one is open, so a separate picker `Modal` never appears and leaves the screen frozen.
- **Fix:** On iOS, the session modals render `IOSDateTimeSheet` (an absolutely positioned `View`, `display="spinner"`) inside the same `Modal`. On Android, renders outside modals with `display="default"`.

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
