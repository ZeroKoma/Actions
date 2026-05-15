# Action Counter (Contador de Acciones)

A lightweight, privacy-focused Progressive Web App (PWA) designed to track daily habits or recurring actions with a single tap.

## 🚀 Features

- **Quick Tracking**: Tap the main card to register an event instantly.
- **Detailed Analytics**:
  - **Diary**: View exact timestamps of each action for any selected day.
  - **Weekly View**: Analyze trends with a custom SVG line chart and daily totals.
  - **Monthly View**: Full calendar grid to visualize activity patterns over the month.
  - **Summary Reports**: Generate detailed weekly or monthly reports from settings, featuring total counts and daily averages with integrated time navigation.
- **Customization & UI**:
  - **Dark Mode**: Fully adaptive interface for eye comfort.
  - **Multilingual Support**: Seamlessly switch between English and Spanish.
  - **Animations**: Smooth view transitions and visual feedback (like the "+1" indicator).
  - **Gesture Navigation**: Swipe left or right on mobile devices to switch between views intuitively.
  - **Undo**: Quickly remove the last accidental entry from the main screen.
  - **Smart Reset**: Clear your logs and action config while preserving your UI preferences (Dark Mode and Language).
- **PWA Support**: Installable on Android and iOS for a native app experience.
  - **Offline Mode**: Full offline functionality and instant loading thanks to an integrated Service Worker.
- **Privacy**: No accounts or servers required. All data stays on your device using the browser's `localStorage`.

## 📂 Project Structure

- `index.html`: The main entry point. Contains the Single Page Application (SPA) structure and view containers.
- `css/style.css`: Centralized styling including theme variables, animations, and dark mode overrides.
- `js/`:
  - `main.js`: Application entry point that orchestrates the initialization.
  - `ui.js`: Handles User Interface logic, view switching, translations, and feedback animations.
  - `calendar.js`: Manages the generation of weekly/monthly grids and the history timeline.
  - `storage.js`: A dedicated data access layer for `localStorage` (DB).
  - `utils.js`: Common utility functions for date formatting and data processing.
  - `menu.js`: Logic for sidebar and navigation interactions.
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
- **Dynamic SVG**: The weekly trend chart and icons are rendered as SVGs for high performance and clarity on all resolutions.
- **Local Persistence**: Data survives page refreshes and browser restarts.

## 📄 License

Open-source and free to use for personal habit tracking.