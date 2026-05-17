# Action Counter (Contador de Acciones)

A lightweight, privacy-focused Progressive Web App (PWA) designed to track daily habits or recurring actions with a single tap.

## 🚀 Features

- **Quick Tracking**: Tap the main card to register an event instantly.
- **Mobile-First Experience**: Optimized UI with a bottom navigation bar and no intrusive side menus, designed for one-handed use.
- **Flexible Scheduling**: Configure specific target days for each action (e.g., "Tuesday and Thursday") with visual "today" indicators.
- **Detailed Analytics**:
  - **Diary**: View and manage exact timestamps. Tap any entry to update the time or delete it.
  - **Weekly View**: Analyze trends with a custom SVG line chart and daily totals.
  - **Monthly View**: Full calendar grid to visualize activity patterns over the month.
  - **Summary Reports**: Generate detailed weekly or monthly reports from settings, featuring total counts and daily averages with integrated time navigation.
- **Smart Navigation**:
  - Tap any calendar cell with activity to jump directly to that day's Diary.
  - Tap an empty cell (current or past) to open the Manual Entry dialog pre-filled with that date.
- **Customization & UI**:
  - **Dark Mode**: Fully adaptive interface for eye comfort.
  - **Multilingual Support**: Seamlessly switch between English and Spanish.
  - **Animations**: Smooth view transitions and visual feedback (like the "+1" indicator).
  - **Gesture Navigation**: Intuitive horizontal swipe support to navigate between Main, Diary, Weekly, Monthly, and Settings views.
  - **Undo**: Quickly remove the last accidental entry from the main screen.
  - **Smart Reset**: Clear your logs and action config while preserving your UI preferences (Dark Mode and Language).
- **PWA Support**: Installable on Android and iOS for a native app experience.
  - **Offline Mode**: Full offline functionality, instant loading, and background sync support via Service Worker.
  - **Automatic Updates**: Intelligent update system that notifies the user and refreshes the app when a new version is deployed.
- **Privacy**: No accounts or servers required. All data stays on your device using **IndexedDB** for high-performance local storage.

## 📂 Project Structure

- `index.html`: The main entry point. Contains the Single Page Application (SPA) structure and view containers.
- `css/style.css`: Centralized styling including theme variables, animations, and dark mode overrides.
- `js/`:
  - `main.js`: Application entry point that orchestrates the initialization.
  - `ui.js`: Handles User Interface logic, view switching, translations, and feedback animations.
  - `calendar.js`: Manages the generation of weekly/monthly grids and the history timeline.
  - `storage.js`: A dedicated data access layer for `localStorage` (DB).
  - `utils.js`: Common utility functions for date formatting and data processing.
- `manifest.json`: Configuration for PWA installation, defining icons and theme behavior.

## 🛠️ Installation & Usage

This is a client-side application with no external dependencies:

1. Clone the repository to your local machine.
2. Open `index.html` in any modern web browser.
3. To use it as an app, select "Add to Home Screen" from your mobile browser's menu.

### How to Install as a PWA

**On Android (Chrome):**
1. Open the app URL in Chrome.
2. Tap the three-dot menu and select **"Install app"** or **"Add to Home Screen"**.

**On iOS (Safari):**
1. Open the app URL in Safari.
2. Tap the **Share** button (square with an upward arrow).
3. Scroll down and select **"Add to Home Screen"**.

## 📝 Technical Details

- **Vanilla Stack**: Built with pure HTML5, CSS3, and ES6+ JavaScript.
- **Responsive Design**: Mobile-first approach with a dedicated bottom navigation bar for small screens.
- **Dynamic SVG**: Custom-built weekly trend charts and interactive icons rendered as high-performance SVGs.
- **Smooth Transitions**: Hardware-accelerated CSS animations for view switching (slide-in/out).
 - **Lifecycle Management**: Service Worker with automated cache busting and versioning linked to `Utils.VERSION`.
 - **Data Persistence**: Robust storage via IndexedDB with automatic migration from legacy localStorage systems.

## 📄 License

Open-source and free to use for personal habit tracking.