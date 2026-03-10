# Running StoryRun on Android

Two ways to get this on your Android phone or tablet.

---

## Option A — PWA (Easiest, 5 minutes)

This turns the website into an installable app with no app store required.

### Requirements
- The app must be deployed to Vercel first (see DEPLOY.md)
- Android device with Chrome 67+

### Steps
1. Open Chrome on your Android phone or tablet
2. Go to your Vercel URL (e.g. `https://storyrun.vercel.app`)
3. Tap the **⋮ menu** (three dots, top right)
4. Tap **"Add to Home screen"** or **"Install app"**
5. Confirm — the app icon appears on your home screen

That's it. It opens fullscreen with no browser chrome, just like a real app.

### What you get
- Home screen icon
- Fullscreen standalone mode (no browser address bar)
- App appears in your recent apps list
- Offline support for the editor (export still needs internet)
- Adapts between phone portrait and tablet landscape layouts
- "Export & Share" button opens Android's native share sheet to send directly to Instagram, WhatsApp, etc.

---

## Option B — Native APK via Capacitor (Play Store quality)

Wraps the web app in a real Android shell. You can distribute it via the Play Store or sideload the .apk directly.

### Requirements
- Node.js installed on your computer
- Android Studio installed (free): https://developer.android.com/studio
- Java 17+ (included with Android Studio)

### Step 1 — Install Capacitor

In the project folder:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init StoryRun com.storyrun.app --web-dir out
```

### Step 2 — Configure for static export

Add this to `next.config.js` inside `nextConfig`:
```js
output: 'export',
trailingSlash: true,
```

**Important:** The API routes (Strava OAuth, PNG export) won't work in a fully static build.
You have two options:
- Keep the API hosted on Vercel and point the app to it
- Use a backend service URL in your environment variables

### Step 3 — Build and sync

```bash
npm run build        # generates the 'out' folder
npx cap add android
npx cap sync android
```

### Step 4 — Open in Android Studio

```bash
npx cap open android
```

Android Studio opens. Click the green **▶ Run** button to launch on your connected device or emulator.

### Step 5 — Build the APK

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Choose **APK**
3. Create a keystore (first time) — save this file, you need it for updates
4. Build → your `.apk` is in `android/app/build/outputs/apk/release/`

### Sideload without Play Store
On your Android device:
1. Settings → Security → enable "Install unknown apps" for Chrome/Files
2. Transfer the `.apk` to your device (via USB, Google Drive, email)
3. Tap it to install

### Publish to Play Store
1. Create a Google Play Developer account ($25 one-time fee)
2. In Play Console → Create app → upload the `.apk` or `.aab`
3. Fill out the store listing and submit for review (~3 days)

---

## Layout on different screen sizes

The app has three responsive layouts:

| Device | Layout |
|--------|--------|
| Phone portrait | Full-screen cards + bottom nav (Runs / Preview / Edit) |
| Tablet portrait | Preview + activity list on left, controls on right |
| Tablet landscape | Classic 3-column desktop layout |

## Sharing the exported story

On Android, when you tap **Export & Share**, the app uses the native Android share sheet. You can share directly to:
- Instagram (as a Story)
- WhatsApp
- Google Photos
- Any other app that accepts images

No need to find the file in Downloads.
