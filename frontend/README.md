# Surakshit VMS - Frontend

Enterprise-grade Video Management System frontend for surveillance and AI-powered analytics.

## Table of Contents

1. [Introduction](#introduction)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Docker Deployment](#docker-deployment)
6. [Environment & Configuration](#environment--configuration)
7. [Application Architecture](#application-architecture)
8. [Pages & Features](#pages--features)
9. [Component Architecture](#component-architecture)
10. [State Management](#state-management)
11. [Theming & Styling](#theming--styling)
12. [Sidebar Navigation](#sidebar-navigation)
13. [Available Scripts](#available-scripts)

---

## Tech Stack

| Category            | Technology                                      |
| ------------------- | ----------------------------------------------- |
| **Framework**       | React 19                                        |
| **Build Tool**      | Vite 8                                          |
| **Styling**         | Tailwind CSS 4                                  |
| **Routing**         | React Router DOM 7                              |
| **Animations**      | Framer Motion 12                                |
| **Icons**           | React Icons, Lucide React                       |
| **Charts**          | Recharts 3                                      |
| **Video Streaming** | HLS.js 1                                        |
| **Maps**            | MapLibre GL 5, React Map GL 8                   |
| **Deck Layers**     | deck.gl 9 (aggregation + data layers)           |
| **Responsive**      | react-responsive 10                             |
| **Calendar**        | react-calendar 6                                |
| **Linting**         | ESLint 10 + react-hooks + react-refresh plugins |

---

## Project Structure

```
frontend/
├── public/                         # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Root component
│   ├── index.css                   # Global styles, Tailwind, CSS variables
│   │
│   ├── router/
│   │   └── AppRoutes.jsx           # All route definitions
│   │
│   ├── pages/                      # Page-level components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── LiveStreaming.jsx
│   │   ├── Playback.jsx
│   │   ├── Addcamera.jsx
│   │   ├── AnprDashboard.jsx
│   │   ├── AnprReports.jsx
│   │   ├── VehicleTracking.jsx
│   │   ├── BlacklistVehicles.jsx
│   │   ├── FaceRecognition.jsx
│   │   ├── PeopleCounting.jsx
│   │   ├── LineCrossing.jsx
│   │   ├── ObjectDetection.jsx
│   │   ├── Reports.jsx
│   │   ├── Settings.jsx
│   │   ├── About.jsx
│   │   └── Users.jsx
│   │
│   ├── components/
│   │   ├── layout/                 # App shell
│   │   │   ├── MainLayout.jsx
│   │   │   ├── MainLayout.css
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── sidebarConfig.js
│   │   │
│   │   ├── Header/                 # Header sub-components
│   │   │   ├── HeaderActions.jsx
│   │   │   ├── HeaderText.jsx
│   │   │   ├── HeaderTime.jsx
│   │   │   ├── FullscreenButton.jsx
│   │   │   ├── NotificationButton.jsx
│   │   │   ├── ProfileDropdown.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── UserProfile.jsx
│   │   │
│   │   ├── common/                 # Shared components
│   │   │   ├── BodyHead.jsx
│   │   │   ├── BodyContainer.jsx
│   │   │   ├── MenuSection.jsx
│   │   │   ├── ConfirmDeleteModal.jsx
│   │   │   ├── DetectionOverlay.jsx
│   │   │   ├── MapModal.jsx
│   │   │   └── Skeleton.jsx
│   │   │
│   │   ├── dashboard/              # Dashboard components
│   │   │   ├── TopCard.jsx
│   │   │   ├── BottomStats.jsx
│   │   │   ├── TotalCameraGraph.jsx
│   │   │   ├── CameraReport.jsx
│   │   │   ├── LiveMapOverview.jsx
│   │   │   └── mockData.js
│   │   │
│   │   ├── livestream/             # Live Streaming components
│   │   │   ├── CameraSidebar.jsx
│   │   │   ├── CameraTile.jsx
│   │   │   ├── PTZPanel.jsx
│   │   │   ├── StreamingHeader.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   └── ZoomModal.jsx
│   │   │
│   │   ├── playback/               # Playback components
│   │   │   ├── PlaybackGrid.jsx
│   │   │   ├── PlaybackToolbar.jsx
│   │   │   ├── MultiTimeline.jsx
│   │   │   ├── LeftPanel.jsx
│   │   │   └── HLSPlayer.jsx
│   │   │
│   │   ├── addCamera/              # Add Camera components
│   │   │   ├── CameraHeader.jsx
│   │   │   ├── CameraTable.jsx
│   │   │   ├── CameraData.js
│   │   │   ├── CameraDetailsDrawer.jsx
│   │   │   └── AddCameraModal.jsx
│   │   │
│   │   ├── AnprDashboard/          # ANPR components
│   │   │   ├── LPRContainer.jsx
│   │   │   ├── DetectionChart.jsx
│   │   │   ├── TopCamerasByDetections.jsx
│   │   │   ├── DetectionsByVehicleType.jsx
│   │   │   ├── DetectionsByVehicleColor.jsx
│   │   │   ├── BlacklistStats.jsx
│   │   │   └── RecentBlacklistHits.jsx
│   │   │
│   │   ├── VehicleTracking/        # Vehicle Tracking components
│   │   │   ├── DetectionResultsTable.jsx
│   │   │   ├── SearchVehicle.jsx
│   │   │   └── VehicleMovementPath.jsx
│   │   │
│   │   ├── blocklist/              # Blacklist components
│   │   │   ├── BlacklistHeader.jsx
│   │   │   ├── BlacklistTable.jsx
│   │   │   └── AddBlacklistModal.jsx
│   │   │
│   │   ├── users/                  # User Management components
│   │   │   ├── UserHeader.jsx
│   │   │   ├── UserTable.jsx
│   │   │   └── AddUserModal.jsx
│   │   │
│   │   ├── settings/               # Settings components
│   │   │   ├── ThemeSettings.jsx
│   │   │   ├── UserSettings.jsx
│   │   │   ├── AddCameraSettings.jsx
│   │   │   ├── AddDepartmentsSettings.jsx
│   │   │   ├── CentralDataSettings.jsx
│   │   │   ├── LicenseManagementSettings.jsx
│   │   │   ├── StorageSettings.jsx
│   │   │   └── SystemLogSettings.jsx
│   │   │
│   │   ├── about/                  # About page components
│   │   │   └── VMSDetails.jsx
│   │   │
│   │   └── FaceSidebar.jsx         # Face Recognition sidebar
│   │
│   ├── Context/                    # React Context providers
│   │   ├── LiveStreamingContext.jsx
│   │   ├── PlaybackContext.jsx
│   │   ├── GridFullscreenContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useHLSPlayer.js
│   │   ├── useDarkMode.js
│   │   └── osm_providers.js
│   │
│   ├── api/                        # API services
│   │   └── userService.js
│   │
│   ├── constants/                  # App constants
│   │   └── colors.js
│   │
│   ├── Theme/
│   │   └── Palette.js              # Light/dark color palette
│   │
│   └── assets/                     # Images, logos, SVGs
│       ├── logo.png
│       ├── logo-new.png
│       ├── login.jpeg
│       ├── Delhi_Police_Logo.png
│       ├── background-5.jpg
│       └── user/
│           └── user.jpg
│
├── dist/                           # Production build output
├── index.html                      # HTML shell
├── package.json
├── vite.config.js
├── tailwind.config.js
├── eslint.config.js
├── Dockerfile
└── .dockerignore
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18 (recommended: 20 LTS)
- **npm** >= 9
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Surakshitcity/SURAKSHIT-VMS-frontend.git
cd SURAKSHIT-VMS-frontend/frontend

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

The dev server starts at **http://localhost:5173** and accepts connections from all network interfaces (`host: "0.0.0.0"`).

### Build & Production

```bash
# Create optimized production build
npm run build

# Preview the production build locally
npm run preview
```

Build output goes to the `dist/` directory.

---

## Docker Deployment

```bash
# Build and run
docker build -t surakshit-vms-frontend .
docker run -p 80:80 surakshit-vms-frontend
```

---

## Environment & Configuration

| File                 | Purpose                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| `vite.config.js`     | Vite config: React plugin, Tailwind plugin, dev server on `0.0.0.0:5173`    |
| `tailwind.config.js` | Tailwind content paths + `tailwind-scrollbar-hide` plugin                   |
| `eslint.config.js`   | ESLint flat config: recommended rules + React Hooks + React Refresh         |
| `index.html`         | HTML shell, loads Orbitron font from Google Fonts, mounts `<div id="root">` |

The app uses hardcoded demo stream URLs and mock data. No `.env` file is required.

---

## Application Architecture

### Entry Points

1. **`index.html`** - Loads `/src/main.jsx` as a module
2. **`src/main.jsx`** - Creates React root, renders `<App />` inside `<StrictMode>`, imports `maplibre-gl` CSS
3. **`src/App.jsx`** - Simply renders `<AppRoutes />`
4. **`src/router/AppRoutes.jsx`** - Defines all routes, wraps with providers

### Routing

All routes are defined in `AppRoutes.jsx` using React Router v7:

| Route              | Component           | Layout     | Description                       |
| ------------------ | ------------------- | ---------- | --------------------------------- |
| `/`                | `Login`             | None       | Public login page                 |
| `/dashboard`       | `Dashboard`         | MainLayout | Overview with stats, map, charts  |
| `/live`            | `LiveStreaming`     | MainLayout | Multi-camera live grid with PTZ   |
| `/playback`        | `Playback`          | MainLayout | Recorded video playback           |
| `/add-camera`      | `Addcamera`         | MainLayout | Camera directory management       |
| `/face`            | `FaceRecognition`   | MainLayout | Face recognition AI config        |
| `/people`          | `PeopleCounting`    | MainLayout | People counting AI config         |
| `/line-crossing`   | `LineCrossing`      | MainLayout | Line crossing detection config    |
| `/object-detection`| `ObjectDetection`   | MainLayout | Object detection AI config        |
| `/anpr-dashboard`  | `AnprDashboard`     | MainLayout | ANPR analytics dashboard          |
| `/tracking`        | `VehicleTracking`   | MainLayout | Vehicle detection log             |
| `/blacklist-vehicles`| `BlacklistVehicles` | MainLayout | Blacklisted vehicles management  |
| `/reports`         | `Reports`           | MainLayout | System report generation          |
| `/anpr-reports`    | `AnprReports`       | MainLayout | ANPR report generation            |
| `/settings`        | `Settings`          | MainLayout | System settings                   |
| `/about`           | `About`             | MainLayout | VMS details and version info      |
| `*`                | Redirect to `/`     | None       | Catch-all fallback                |

Providers: `GridFullscreenProvider` and `LiveStreamingProvider` wrap all routes.

### Layout System

**`MainLayout`** provides the app shell:

```
+----------+---------------------------+
|          |       Header              |
| Sidebar  +---------------------------+
|          |                           |
|          |   <Outlet /> (Page)       |
|          |                           |
+----------+---------------------------+
```

- **Sidebar** - Collapsible navigation with search, animated transitions
- **Header** - Top bar with theme toggle, notifications, profile, fullscreen, clock
- **`<Outlet />`** - React Router renders the active page here

---

## Pages & Features

### Login

**Route:** `/` | **File:** `src/pages/Login.jsx`

- Full-screen login with background image and glassmorphism form
- Left panel: Branding with 4 stat cards (Live Monitoring, Vehicle Tracking, Incident Alerts, AI Analytics)
- Right panel: User ID, Password (show/hide), Remember Me, Login button
- Responsive layout (left panel hidden on mobile)

### Dashboard

**Route:** `/dashboard` | **File:** `src/pages/Dashboard.jsx`

- **TopCard** - KPI stat cards with trends
- **LiveMapOverview** - Interactive MapLibre GL map with camera locations and radar filtering
- **TotalCameraGraph** - Weekly bar chart of live vs offline cameras
- **CameraReport** - Camera status report
- **BottomStats** - Additional statistics

### Live Monitoring

**Route:** `/live` | **File:** `src/pages/LiveStreaming.jsx`

- **Configurable grid** (1x1, 2x2, 3x3, 4x4, 8x8, custom) with dynamic cell sizing
- **Camera sidebar** - Browse cameras by zone groups, select/deselect, bulk operations
- **Drag and drop** - Reorder cameras by dragging onto grid cells
- **HLS streaming** - Each tile plays an HLS stream via `hls.js`
- **PTZ Controls** - Pan-Tilt-Zoom with mouse dragging directional pad, zoom, focus, speed sliders, camera presets
- **Auto-Shift** - Auto-rotate through camera pages with configurable interval (30 sec, 1 min, 5 min, custom)
- **Audio toggle** - Per-camera mute/unmute
- **Tile fullscreen** - Individual camera fullscreen with PTZ panel
- **Grid fullscreen** - Entire grid in browser fullscreen
- **Snapshot** - Capture camera frame
- **Refresh** - Reload all streams
- **Mobile responsive** - Auto-collapses sidebar, forces smaller grid
- **Persistence** - Camera selection, grid size, mute states, auto-shift settings saved to `localStorage`

### Playback

**Route:** `/playback` | **File:** `src/pages/Playback.jsx`

- **LeftPanel** - Camera tree browser with calendar date picker
- **PlaybackGrid** - Multi-camera playback grid with configurable layout
- **PlaybackToolbar** - Play/pause, grid selector, time controls
- **MultiTimeline** - Synchronized multi-camera timeline scrubber
- **HLSPlayer** - HLS video player component
- **PlaybackContext** - Global state for playback session

### Add Camera

**Route:** `/add-camera` | **File:** `src/pages/Addcamera.jsx`

- **CameraTable** - Sortable table with Name, IP, Zone, Status, Actions
- **CameraHeader** - Search, status filter, zone filter, bulk delete, add camera
- **AddCameraModal** - Form to add new cameras (name, IP, zone, RTSP URL)
- **CameraDetailsDrawer** - Slide-in drawer with full camera details
- **Zone management** - Create/delete deployment zones
- **Visibility toggle** - Show/hide cameras on the map

### ANPR Dashboard

**Route:** `/anpr-dashboard` | **File:** `src/pages/AnprDashboard.jsx`

- **LPRContainer** - License Plate Recognition sidebar
- **DetectionChart** - Time-series chart of plate detections
- **TopCamerasByDetections** - Per-camera detection breakdown
- **DetectionsByVehicleType** - Vehicle type distribution
- **DetectionsByVehicleColor** - Vehicle color distribution
- **BlacklistStats** - Blacklist hit statistics
- **RecentBlacklistHits** - Recent blacklist events

### ANPR Reports

**Route:** `/anpr-reports` | **File:** `src/pages/AnprReports.jsx`

- Comprehensive ANPR report generation with date range filtering
- Export capabilities for detection data

### Vehicle Tracking

**Route:** `/tracking` | **File:** `src/pages/VehicleTracking.jsx`

- **SearchVehicle** - Vehicle search interface
- **DetectionResultsTable** - Vehicle detection log with images, plate numbers, location, timestamp
- **VehicleMovementPath** - Vehicle movement visualization

### Blacklist Vehicles

**Route:** `/blacklist-vehicles` | **File:** `src/pages/BlacklistVehicles.jsx`

- **BlacklistHeader** - Search and filter controls
- **BlacklistTable** - Blacklisted vehicles table
- **AddBlacklistModal** - Add vehicles to blacklist

### Face Recognition

**Route:** `/face` | **File:** `src/pages/FaceRecognition.jsx`

- **FaceSidebar** - Configuration panel
- Confidence threshold, database retention, auto-tracking, real-time alerts
- Snapshot storage, audio alerts, recognition mode selector

### People Counting

**Route:** `/people` | **File:** `src/pages/PeopleCounting.jsx`

- Max occupancy threshold, crowd detection glow
- Real-time counting, tailgating alerts
- Direction analysis (entry/exit/both), report interval

### Line Crossing

**Route:** `/line-crossing` | **File:** `src/pages/LineCrossing.jsx`

- Virtual line crossing detection configuration
- Direction-based alerts and counting

### Object Detection

**Route:** `/object-detection` | **File:** `src/pages/ObjectDetection.jsx`

- AI object detection configuration
- Detection zones, object types, sensitivity settings

### Reports

**Route:** `/reports` | **File:** `src/pages/Reports.jsx`

- Export format selection (PDF, CSV)
- Automated delivery scheduling
- Snapshot and archive options

### Settings

**Route:** `/settings` | **File:** `src/pages/Settings.jsx`

- **ThemeSettings** - Light/dark mode toggle
- **UserSettings** - User management
- **AddCameraSettings** - Camera configuration
- **AddDepartmentsSettings** - Department management
- **CentralDataSettings** - Central data configuration
- **LicenseManagementSettings** - License management
- **StorageSettings** - Storage configuration
- **SystemLogSettings** - System logs

### About

**Route:** `/about` | **File:** `src/pages/About.jsx`

- **VMSDetails** - System version, build info, component details

### Users

**Route:** `/users` | **File:** `src/pages/Users.jsx`

- **UserHeader** - Search and filter controls
- **UserTable** - User management table
- **AddUserModal** - Add new users

---

## Component Architecture

### Layout Components

| Component       | File                                 | Description                              |
| --------------- | ------------------------------------ | ---------------------------------------- |
| `MainLayout`    | `components/layout/MainLayout.jsx`   | App shell with sidebar + header + outlet |
| `Sidebar`       | `components/layout/Sidebar.jsx`      | Animated collapsible sidebar with search |
| `Header`        | `components/layout/Header.jsx`       | Top navigation bar                       |
| `sidebarConfig` | `components/layout/sidebarConfig.js` | Navigation menu structure                |

### Header Components

| Component            | File                                    | Description                    |
| -------------------- | --------------------------------------- | ------------------------------ |
| `HeaderText`         | `components/Header/HeaderText.jsx`      | Page title and breadcrumb      |
| `HeaderTime`         | `components/Header/HeaderTime.jsx`      | Live clock display             |
| `HeaderActions`      | `components/Header/HeaderActions.jsx`   | Action buttons container       |
| `FullscreenButton`   | `components/Header/FullscreenButton.jsx`| Browser fullscreen toggle      |
| `NotificationButton` | `components/Header/NotificationButton.jsx` | Notification bell           |
| `ProfileDropdown`    | `components/Header/ProfileDropdown.jsx` | User profile menu              |
| `ThemeToggle`        | `components/Header/ThemeToggle.jsx`     | Dark/light mode toggle         |
| `UserProfile`        | `components/Header/UserProfile.jsx`     | User profile display           |

### Common Components

| Component            | File                                       | Description                     |
| -------------------- | ------------------------------------------ | ------------------------------- |
| `BodyHead`           | `components/common/BodyHead.jsx`           | Reusable page header bar        |
| `BodyContainer`      | `components/common/BodyContainer.jsx`      | Scrollable content wrapper      |
| `MenuSection`        | `components/common/MenuSection.jsx`        | Collapsible sidebar menu group  |
| `ConfirmDeleteModal` | `components/common/ConfirmDeleteModal.jsx` | Delete confirmation dialog      |
| `DetectionOverlay`   | `components/common/DetectionOverlay.jsx`   | AI detection overlay on video   |
| `MapModal`           | `components/common/MapModal.jsx`           | Fullscreen map modal            |
| `Skeleton`           | `components/common/Skeleton.jsx`           | Loading skeleton placeholder    |

### Page-Specific Components

**Dashboard** (`components/dashboard/`):

- `TopCard` - KPI stat cards with trends and percentages
- `BottomStats` - Additional bottom statistics
- `TotalCameraGraph` - Weekly camera status bar chart (Recharts)
- `CameraReport` - Camera status report chart
- `LiveMapOverview` - MapLibre GL map with camera markers and radar filtering
- `mockData` - Demo data for dashboard

**Live Streaming** (`components/livestream/`):

- `CameraSidebar` - Camera group browser with select controls
- `CameraTile` - Individual camera cell with HLS player, audio, PTZ, fullscreen
- `PTZPanel` - Pan-Tilt-Zoom controller with directional pad (mouse drag), zoom/focus/speed sliders, camera presets
- `StreamingHeader` - Grid controls, auto-shift, fullscreen, refresh
- `VideoPlayer` - HLS video element wrapper
- `ZoomModal` - Fullscreen camera modal

**Playback** (`components/playback/`):

- `PlaybackGrid` - Multi-camera playback layout
- `PlaybackToolbar` - Transport controls, grid selector
- `MultiTimeline` - Synchronized timeline scrubber
- `LeftPanel` - Camera browser sidebar with calendar
- `HLSPlayer` - HLS video player for playback

**Add Camera** (`components/addCamera/`):

- `CameraHeader` - Filter bar with search, status, zone, actions
- `CameraTable` - Camera data table with selection, visibility, delete
- `CameraData` - Mock camera dataset
- `CameraDetailsDrawer` - Slide-in camera detail panel
- `AddCameraModal` - Add camera form dialog

**ANPR** (`components/AnprDashboard/`):

- `LPRContainer` - License plate recognition sidebar
- `DetectionChart` - Detection time-series chart
- `TopCamerasByDetections` - Per-camera breakdown chart
- `DetectionsByVehicleType` - Vehicle type distribution chart
- `DetectionsByVehicleColor` - Vehicle color distribution chart
- `BlacklistStats` - Blacklist hit statistics
- `RecentBlacklistHits` - Recent blacklist events table

**Vehicle Tracking** (`components/VehicleTracking/`):

- `DetectionResultsTable` - Vehicle detection log table
- `SearchVehicle` - Vehicle search interface
- `VehicleMovementPath` - Vehicle movement visualization

**Blacklist** (`components/blocklist/`):

- `BlacklistHeader` - Search and filter controls
- `BlacklistTable` - Blacklisted vehicles table
- `AddBlacklistModal` - Add to blacklist form

**Users** (`components/users/`):

- `UserHeader` - Search and filter controls
- `UserTable` - User management table
- `AddUserModal` - Add new user form

**Settings** (`components/settings/`):

- `ThemeSettings` - Light/dark mode configuration
- `UserSettings` - User management settings
- `AddCameraSettings` - Camera configuration settings
- `AddDepartmentsSettings` - Department management
- `CentralDataSettings` - Central data configuration
- `LicenseManagementSettings` - License management
- `StorageSettings` - Storage configuration
- `SystemLogSettings` - System log viewer

---

## State Management

### Contexts

**`LiveStreamingContext`** (`src/Context/LiveStreamingContext.jsx`)

Global state for the live streaming feature:

| State              | Type     | Description                           |
| ------------------ | -------- | ------------------------------------- |
| `cameraGroups`     | `Array`  | Zone groups with camera names         |
| `cameraStreams`    | `Object` | Camera name to HLS stream URL mapping |
| `selectedCams`     | `Array`  | Currently selected camera names       |
| `displayedCams`    | `Array`  | Cameras shown on current grid page    |
| `mutedMap`         | `Object` | Camera name to mute state mapping     |
| `grid`             | `Number` | Grid dimension (1-8 or custom)        |
| `gridCapacity`     | `Number` | Total cells in current grid           |
| `autoShiftEnabled` | `Boolean`| Auto-shift toggle state               |
| `autoShiftInterval`| `Number` | Auto-shift interval in seconds        |
| `shiftPage`        | `Number` | Current auto-shift page               |
| `totalPages`       | `Number` | Total pages for auto-shift            |
| `openGroups`       | `Object` | Which sidebar groups are expanded     |

Actions: `toggleCamera`, `toggleGroup`, `toggleAudio`, `reorderCamera`, `placeCameraAtIndex`, `selectAllInGroup`, `selectAll`, `clearAll`, `setGrid`, `setAutoShiftEnabled`, `setAutoShiftInterval`

All state persists to `localStorage` under key `vms_live_streaming`.

**`PlaybackContext`** (`src/Context/PlaybackContext.jsx`)

Global state for the playback feature:

| State          | Type     | Description                        |
| -------------- | -------- | ---------------------------------- |
| `selectedCams` | `Array`  | Cameras selected for playback      |
| `isPlaying`    | `Boolean`| Playback play/pause state          |
| `currentTime`  | `Number` | Current playback time position     |
| `grid`         | `Number` | Playback grid dimension            |

**`GridFullscreenContext`** (`src/Context/GridFullscreenContext.jsx`)

Manages grid fullscreen state across components.

**`ThemeContext`** (`src/Context/ThemeContext.jsx`)

Manages dark/light mode:

| State        | Type      | Description         |
| ------------ | --------- | ------------------- |
| `isDarkMode` | `Boolean` | Current theme state |

Actions: `toggleTheme`

Persists to `localStorage` under key `theme`. Toggles `dark` class on `document.documentElement`.

### Custom Hooks

| Hook               | File                                   | Description                                                     |
| ------------------ | -------------------------------------- | --------------------------------------------------------------- |
| `useHLSPlayer`     | `src/hooks/useHLSPlayer.js`            | Initializes HLS.js on a video element, handles Safari fallback  |
| `useDarkMode`      | `src/hooks/useDarkMode.js`             | Alternative dark mode hook                                      |
| `usePalette`       | `src/Theme/Palette.js`                 | Returns centralized color palette based on current theme        |
| `useLiveStreaming` | `src/Context/LiveStreamingContext.jsx`  | Access the live streaming context                               |
| `useTheme`         | `src/Context/ThemeContext.jsx`          | Access the theme context                                        |

### API Services

| Service          | File                       | Description                              |
| ---------------- | -------------------------- | ---------------------------------------- |
| `userService`    | `src/api/userService.js`   | User authentication and management API   |

---

## Theming & Styling

### Tailwind CSS

The project uses **Tailwind CSS v4** with the Vite plugin (`@tailwindcss/vite`). Custom theme tokens are defined inline in `src/index.css`.

Additional plugin: `tailwind-scrollbar-hide` for hiding scrollbars.

### CSS Variables (Light/Dark)

Dual-theme system using CSS custom properties:

**Light Mode** (`:root`):

```css
--bg-color: #f5f7fb;
--card-bg: #ffffff;
--text-dark: #0f172a;
--text-muted: #64748b;
--primary-color: #7c3aed;
--border-color: #e2e8f0;
```

**Dark Mode** (`body.dark-mode`):

```css
--bg-color: #0b0f19;
--card-bg: #111827;
--text-dark: #e5e7eb;
--text-muted: #9ca3af;
--primary-color: #8b5cf6;
--border-color: #1f2937;
```

Components use these variables: `bg-[var(--bg-color)]`, `text-[var(--text-dark)]`, `border-[var(--border-color)]`, etc.

### Palette System

`src/Theme/Palette.js` provides a programmatic palette via `usePalette()` hook:

```js
const { accent, surface, text, shadow, isDark } = usePalette();
```

### Constants

`src/constants/colors.js` - Centralized color constants for consistent theming across the application.

---

## Sidebar Navigation

The sidebar is configured declaratively in `sidebarConfig.js`:

```
Dashboard (single)
+-- Video Management (group)
|   +-- Live Monitoring    /live
|   +-- Playback           /playback
|   +-- Reports            /reports
+-- ANPR System (group)
|   +-- ANPR Dashboard     /anpr-dashboard
|   +-- Vehicle Tracking   /tracking
|   +-- Blacklist Vehicles /blacklist-vehicles
|   +-- ANPR Reports       /anpr-reports
+-- AI Analytics (group)
|   +-- Face Recognition   /face
|   +-- People Counting    /people
|   +-- Line Crossing      /line-crossing
|   +-- Object Detection   /object-detection
+-- About (single)         /about
+-- Settings (single)      /settings
```

Features:

- Collapsible/expandable with animated transitions
- Quick search filter
- Active route highlighting with purple accent
- Badge support (danger, success, warning variants)
- Mobile-responsive (auto-collapses)
- Version footer with secure status indicator

---

## Available Scripts

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Start Vite dev server on `http://localhost:5173` |
| `npm run build`   | Create optimized production build in `dist/`     |
| `npm run preview` | Preview production build locally                 |
| `npm run lint`    | Run ESLint on the entire project                 |

---

## ESLint Configuration

Uses ESLint flat config (`eslint.config.js`):

- Extends: `@eslint/js` recommended, `react-hooks` recommended, `react-refresh` vite
- Ignores: `dist/` directory
- Globals: browser globals
- Parser features: JSX enabled

```bash
# Run linting
npm run lint
```
