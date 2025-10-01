# Subscription Tracker

Subscription Tracker is a React Native app built with Expo that keeps a consolidated view of every recurring payment. It helps users stay ahead of renewals with smart reminders, real-time snapshots of monthly spend, and at-a-glance analytics.

## Features

- **Personalised accounts** – local authentication with quick account switching and avatar support.
- **Subscription management** – add, edit, and delete subscriptions with categories, billing cadence, notes, and automatic next-payment rollovers.
- **Reminders** – schedules Expo push notifications before each renewal and realigns them if payment dates shift.
- **Analytics dashboard** – donut chart and summary insights that surface top spend categories and upcoming renewals.
- **Offline-first storage** – persists everything locally via Expo SQLite so the app works without a network connection.

## Tech Stack

- [Expo](https://expo.dev/) (React Native 0.81, Expo SDK 54)
- TypeScript with strict mode
- React Navigation (drawer + native stack)
- Expo SQLite for data persistence
- Expo Notifications for reminders
- AsyncStorage for lightweight session caching
- ESLint + Prettier + Husky + lint-staged

## Getting Started

1. **Install prerequisites**

   - Node.js 22 (managed via [Volta](https://volta.sh) – see `package.json#volta`)
   - npm 10
   - Expo CLI (`npm install -g expo-cli`) if you prefer the global binary

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run start
   ```

   Then choose your target: Expo Go, iOS simulator, Android emulator, or a custom development build.

4. **Run on a specific platform**
   ```bash
   npm run ios
   npm run android
   npm run web
   ```

## Project Structure

```
.
├── App.tsx                      # App bootstrap and navigation entry point
├── app.json                     # Expo runtime configuration
├── assets/                      # Icons, splash art, custom fonts
├── src/
│   ├── components/              # Presentational components (cards, charts, buttons)
│   ├── constants/               # Static lookups (categories, icons)
│   ├── contexts/                # React contexts (e.g., authentication)
│   ├── db/                      # SQLite helpers and repositories
│   ├── navigation/              # Root + auth navigators
│   ├── screens/                 # Screen components by navigation route
│   ├── theme/                   # Color palette, layout helpers, font loading
│   ├── types/                   # Shared TypeScript types
│   └── utils/                   # Cross-cutting helpers (dates, notifications)
└── tests/                       # Placeholder for upcoming test suites
```

## Scripts

| Command                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `npm run start`         | Start the Expo dev server                           |
| `npm run ios`           | Launch the iOS simulator (requires Xcode)           |
| `npm run android`       | Launch the Android emulator                         |
| `npm run web`           | Run the app in a web browser                        |
| `npm run typecheck`     | Type-check the project with the TypeScript compiler |
| `npm run lint`          | Lint the project with ESLint                        |
| `npm run format`        | Format files with Prettier                          |
| `npm run reset-project` | Reset to the Expo starter template                  |

> Additional build, test, and release scripts will be introduced as part of the professionalisation roadmap.

## Configuration & Environment

- **Branding**: Update `app.json` (`name`, `slug`, bundle identifiers) as branding or package IDs evolve.
- **Notifications**: On first launch Expo requests notification permissions; no extra configuration is required during development.
- **Fonts**: Custom Poppins variants are bundled under `assets/fonts` and loaded at app start.

## Release Checklist

- Increment `app.json` version/build metadata.
- Update the changelog (see `CHANGELOG.md`).
- Run linting/formatting before committing (`npm run lint`, `npm run format`).
- Build signed binaries or submit through EAS once CI & build scripts are in place.

## Roadmap

See the issue tracker for the full professionalisation plan. Immediate priorities include automated testing, CI/CD pipelines, secure credential storage, and accessibility enhancements.

## License

This project is licensed under the MIT License – see [`LICENSE`](./LICENSE) for details.
