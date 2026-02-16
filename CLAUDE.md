# CLAUDE.md — Usta Go

## Project Overview

**Usta Go** is a Turkish-language professional home services marketplace (similar to TaskRabbit/Thumbtack) built as a React SPA. Customers request services, professionals (called "Usta") accept and complete jobs, and admins oversee the platform. The UI is entirely in Turkish.

**Current state:** Frontend-only MVP. All data persists in `localStorage` — there is no backend or API integration yet.

## Tech Stack

- **React 18.2** — UI framework (functional components, hooks only)
- **Vite 5.0** — Build tool and dev server
- **React Router DOM 6.20** — Client-side routing
- **Tailwind CSS 3.3** — Utility-first styling
- **Lucide React 0.263** — Icon library
- **PostCSS + Autoprefixer** — CSS processing

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build (output: dist/)
npm run preview   # Preview production build locally
```

There is no test framework, linter, or formatter configured.

## Project Structure

```
├── index.html                  # HTML entry point (lang="tr")
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite config (React plugin)
├── tailwind.config.js          # Tailwind content paths
├── postcss.config.js           # PostCSS + Autoprefixer
└── src/
    ├── main.jsx                # React DOM entry — renders <App />
    ├── App.jsx                 # Root component, all route definitions
    ├── index.css               # Global styles, Google Fonts (Inter), custom utilities
    ├── context/
    │   └── AuthContext.jsx     # Global state: auth, jobs, messages (localStorage)
    ├── components/
    │   └── HamburgerMenu.jsx   # Reusable hamburger menu overlay
    └── pages/                  # One file per page (18 pages)
        ├── AuthPage.jsx            # Login / Register
        ├── HomePage.jsx            # Customer home (service categories)
        ├── ElectricServicesPage.jsx # Electric services listing
        ├── CreateJobPage.jsx       # Create job request (with AI price estimate)
        ├── JobDetailPage.jsx       # Job detail & workflow progression
        ├── MyJobsPage.jsx          # User's active/completed jobs
        ├── MessagesPage.jsx        # Messaging between customer & professional
        ├── RateJobPage.jsx         # Post-job rating (1-5 stars + review)
        ├── ProfessionalDashboard.jsx  # Professional main dashboard
        ├── ProfessionalProfilePage.jsx # Professional public profile
        ├── WalletPage.jsx          # Earnings & transaction history
        ├── WithdrawPage.jsx        # Withdrawal requests
        ├── AdminDashboard.jsx      # Admin overview panel
        ├── AdminWithdrawalsPage.jsx # Admin withdrawal approval
        ├── ProfilePage.jsx         # User profile
        ├── SettingsPage.jsx        # User settings
        ├── NotificationsPage.jsx   # Notifications
        └── CancelJobPage.jsx       # Cancel job workflow
```

## Architecture

### State Management

All global state lives in `src/context/AuthContext.jsx` using React Context + `useState`. There is no Redux, Zustand, or other state library.

**Key state:**
- `user` — Current logged-in user object (persisted in `localStorage` key `user`)
- `jobs` — Array of all job objects (persisted in `localStorage` key `jobs`)
- `messages` — Array of all messages (persisted in `localStorage` key `messages`)
- `users` — Registered users stored directly in `localStorage` key `users`

**Context-provided functions:** `login`, `register`, `logout`, `acceptJob`, `startJob`, `completeJob`, `rateJob`, `sendMessage`, `getJobMessages`, `getUserJobs`, `getPendingJobs`

Access global state via the `useAuth()` hook.

### Routing

All routes are defined in `src/App.jsx`. Routes are wrapped with `<ProtectedRoute>` which checks authentication and optionally enforces a `roleRequired` prop. Unauthenticated users redirect to `/`. Unauthorized role access redirects to the user's own dashboard.

**Route groups:**
- `/` — Auth page (public, redirects if logged in)
- `/home`, `/services/*`, `/create-job` — Customer-only routes
- `/professional`, `/wallet`, `/withdraw` — Professional-only routes
- `/admin`, `/admin/withdrawals` — Admin-only routes
- `/profile`, `/settings`, `/notifications`, `/my-jobs`, `/messages`, `/job/:id`, `/rate/:id`, `/cancel-job/:id`, `/professional-profile/:id` — Shared (any authenticated user)
- `/*` — Catch-all redirects to `/`

### Three User Roles

| Role | Value | Dashboard |
|------|-------|-----------|
| Customer (Müşteri) | `customer` | `/home` |
| Professional (Usta) | `professional` | `/professional` |
| Admin (Yönetici) | `admin` | `/admin` |

**Hardcoded admin:** `admin@admin.com` / `1234`

### Job Lifecycle

`pending` → `accepted` → `in_progress` → `completed` → `rated`

1. Customer creates job (status: `pending`)
2. Professional accepts (status: `accepted`, professional assigned)
3. Professional takes before photos & starts (status: `in_progress`)
4. Professional takes after photos & completes (status: `completed`)
5. Customer/professional rates (status: `rated`)

### Data Models

**User:**
```
{ id, email, password, name, role, phone, avatar, rating, completedJobs, createdAt }
```

**Job:**
```
{ id, title, customer, professional, location: { address, lat, lng },
  description, price, date, status, urgent, category,
  beforePhotos[], afterPhotos[], rating, startedAt, completedAt }
```

**Message:**
```
{ id, jobId, text, sender, timestamp }
```

## Code Conventions

### General
- **Functional components only** — no class components
- **React hooks** — `useState`, `useEffect`, `useContext`, `useNavigate`, `useParams`
- **PascalCase** file names for components (e.g., `JobDetailPage.jsx`)
- **camelCase** for variables, functions, and state
- **JSX files** use `.jsx` extension
- All user-facing strings are in **Turkish**
- Comments in source code are in Turkish

### Styling
- Tailwind utility classes for all styling inline in JSX
- Custom classes in `src/index.css`: `.blue-gradient-bg`, `.blur-card`, `.coming-soon-badge`
- **Mobile-first** design with bottom navigation bars
- Color themes by role: blue (customer), green (professional), purple (admin)
- Google Fonts: Inter (weights 400-900)

### Component Patterns
- Each page is a self-contained component in `src/pages/`
- Pages manage their own local state with `useState`
- Global state accessed via `useAuth()` hook
- Navigation via `useNavigate()` from react-router-dom
- Loading states use spinning border animation
- Confirmation dialogs use `window.confirm()`

### File Organization
- One page component per file
- No barrel exports or index files
- Imports in App.jsx are explicit per-page imports
- Single shared component (`HamburgerMenu`) in `components/`

## Known Limitations / Future Work

- **No backend** — all data in localStorage (passwords stored in plaintext)
- **No tests** — no testing framework configured
- **No linting** — no ESLint or Prettier
- **No API integration** — AI price estimation is simulated with keyword matching and a 2s delay
- **Photos are placeholder URLs** (placehold.co) — no actual file upload
- **Only electric services active** — other 5 service categories show "coming soon"
- **Google Maps** — navigation opens external Google Maps URL, no embedded map SDK
