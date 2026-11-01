# Charge Vide ⚡

A JavaScript-first Android charging companion with a tiny expressive digital pet.

## Current milestone: UI + live battery preview

This first version includes:
- Dark interface with lime-green mascot styling.
- A gently floating original bot character.
- Tap-to-cycle facial expressions.
- Live battery percentage and charging state while the app is open, using `expo-battery`.

## Run locally

Install Node.js LTS, then:

```bash
npm install
npx expo start
```

Install **Expo Go** on an Android phone and scan the QR code to preview the interface.

For a native Android build:

```bash
npx expo prebuild --platform android
```

Then build with an Android SDK/Gradle setup, or configure an EAS Build project.

## Important Android limitation

This is currently an in-app prototype. It does **not** yet automatically open over the lock screen or other apps when a charger is connected. Android limits background apps from launching full-screen activities. The next milestone is a native Android charging-event integration and a user-controlled, Android-compliant charging presentation (for example, a notification that opens the character screen).

## Roadmap

1. [x] Initial JavaScript app and mascot prototype
2. [x] Live battery level/state while app is open
3. [ ] More natural eye animations and mood transitions
4. [ ] Native background charging-event handling
5. [ ] Charging notification / presentation settings
6. [ ] Cloud APK build workflow
