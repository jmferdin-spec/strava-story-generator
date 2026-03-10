# 🏃 Strava Story Generator

Transform your Strava runs into stunning **1080×1920 Instagram Stories** with custom overlays, route maps, and beautiful stat layouts.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?style=flat-square&logo=tailwindcss)

---

## ✨ Features

| Feature | Details |
|---|---|
| **Strava OAuth** | Secure OAuth 2.0 with token refresh |
| **Activity Selector** | Shows latest 20 runs with stats |
| **Photo Upload** | Drag & drop with auto-crop to 9:16 |
| **5 Templates** | Minimal, Large Center, Route Focus, Gradient Bar, Athlete Poster |
| **Full Customization** | Fonts, colors, stats, layout, route |
| **Route Rendering** | Decoded GPS polyline → beautiful SVG |
| **Live Preview** | Real-time iframe preview at any scale |
| **PNG Export** | 1080×1920 via Puppeteer with safe zones |

---

## 🚀 Setup

### 1. Clone and install

```bash
git clone <repo>
cd strava-story-generator
npm install
```

### 2. Create a Strava API App

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create a new application
3. Set **Authorization Callback Domain** to `localhost`
4. Note your **Client ID** and **Client Secret**

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
SESSION_SECRET=generate-a-random-32-char-string-here
```

> **Generate a SESSION_SECRET:** Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
strava-story-generator/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page with Strava OAuth login
│   ├── globals.css                 # Global styles & design tokens
│   ├── dashboard/
│   │   └── page.tsx                # Main 3-panel editor
│   └── api/
│       ├── strava/
│       │   ├── auth/route.ts       # OAuth redirect to Strava
│       │   ├── callback/route.ts   # OAuth code → token exchange
│       │   └── activities/route.ts # Fetch + filter running activities
│       └── generate-story/
│           └── route.ts            # Puppeteer HTML → PNG export
│
├── components/
│   ├── ActivitySelector/           # Left panel: activity cards
│   ├── ImageUploader/              # Photo drag-and-drop with crop
│   ├── StoryPreview/               # Center: scaled iframe preview
│   ├── TemplateSelector/           # Template picker with thumbnails
│   ├── FontControls/               # Font family, size, weight
│   ├── ColorControls/              # Color pickers for all colors
│   ├── StatControls/               # Stat visibility + alignment
│   ├── RouteControls/              # Route color, thickness, position
│   └── ExportButton/               # Trigger Puppeteer export
│
├── lib/
│   ├── strava.ts                   # Strava API + formatting utilities
│   ├── polylineDecoder.ts          # Google Encoded Polyline decoder
│   ├── routeRenderer.ts            # Polyline → SVG path generator
│   └── storyTemplates.ts           # Template definitions + HTML generator
│
├── store/
│   └── useStoryStore.ts            # Zustand global state
│
└── types/
    └── index.ts                    # All TypeScript types
```

---

## 🎨 Templates

### 1. Minimal Bottom
Clean, modern layout with stats at the bottom. Subtle gradient overlay. Best for photo-heavy stories.

### 2. Large Center
Bold, high-impact with the distance stat dominating the center. Great for sharing big milestones.

### 3. Route Focus
Puts your GPS route front-and-center. Monospace font for a data-driven feel.

### 4. Gradient Bar
Stats in a sleek Strava-orange gradient bar at the bottom. High contrast, always readable.

### 5. Athlete Poster
Editorial magazine style with an accent line and oversized distance. For the aesthetic athlete.

---

## 🛠️ Architecture

### Rendering Pipeline

```
User clicks "Export PNG"
  └→ POST /api/generate-story
       ├→ Build stats from activity data
       ├→ Generate route SVG from polyline
       ├→ Generate HTML template (with embedded base64 bg image)
       ├→ Launch Puppeteer (headless Chrome)
       ├→ page.setViewport({ width: 1080, height: 1920 })
       ├→ page.setContent(html, { waitUntil: 'networkidle0' })
       ├→ Wait for fonts (document.fonts.ready)
       ├→ page.screenshot({ type: 'png', clip: 1080×1920 })
       └→ Return PNG buffer → browser download
```

### Route Rendering

```
Strava summary_polyline (encoded string)
  └→ decodePolyline() → LatLng[]
       └→ simplifyPolyline() (RDP algorithm)
            └→ getBounds() → project to SVG viewport
                 └→ SVG path with Q (quadratic bezier) curves
                      └→ Glow layer + shadow layer + main line + dots
```

### State Management

All story configuration lives in a single Zustand store (`useStoryStore`). The store uses `immer` middleware for immutable updates. The preview automatically re-renders whenever any config value changes.

---

## 🔧 Customization

### Adding a New Template

1. Add the template definition to `lib/storyTemplates.ts`:

```typescript
{
  id: 'my-template',
  name: 'My Template',
  description: 'Description here',
  thumbnail: '◆',
  defaults: {
    fontFamily: 'Bebas Neue',
    statAlignment: 'center',
    // ... other defaults
  }
}
```

2. Add the overlay style in `getOverlayStyle()`
3. Add the stat block HTML in `getStatBlockHtml()`
4. Add the CSS in `getTemplateStyles()`
5. Add a thumbnail preview in `TemplateSelector/index.tsx`

### Adding a New Font

1. Add to `FONT_OPTIONS` in `FontControls/index.tsx`
2. Add the Google Fonts URL in `getGoogleFontsUrl()` in `storyTemplates.ts`
3. Add to the `FontFamily` type in `types/index.ts`

---

## 🔐 Authentication & Security

- Access tokens stored in **HTTP-only cookies** (not accessible via JS)
- Refresh tokens auto-renew when access token expires
- Athlete info stored in a regular cookie (read-only client-side display)
- No tokens are stored server-side (stateless)
- Strava scope: `read,activity:read_all` — we **never write** to Strava

---

## 📱 Instagram Story Safe Zones

The editor shows safe zone guidelines:
- **Top margin:** 250px (Instagram navigation overlay area)
- **Bottom margin:** 300px (Instagram CTA button area)

The Puppeteer export clips exactly to 1080×1920px.

---

## ⚡ Performance Notes

- Route polylines are simplified using the Ramer-Douglas-Peucker algorithm
- Background images are processed client-side (Canvas API) before being stored as base64
- Preview uses a scaled iframe — no server round-trips for preview updates
- Puppeteer is lazy-loaded on the server only when export is triggered

---

## 🐛 Troubleshooting

### "Puppeteer failed to launch"
```bash
# Install Puppeteer with bundled Chromium
npm install puppeteer

# On Linux, you may need additional deps:
sudo apt-get install -y libgbm-dev libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2
```

### "Strava authorization failed"
- Double-check `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`
- Ensure `STRAVA_REDIRECT_URI` in `.env.local` matches the callback URL in your Strava app settings exactly

### "No activities found"
- The app filters for activities with `type === 'Run'` or `sport_type` containing 'Run'
- Try adjusting the filter in `lib/strava.ts` `getActivities()`

### Image looks low quality
- Increase the JPEG quality in `ImageUploader` (currently 0.92)
- Or change to PNG: `canvas.toDataURL('image/png')`

---

## 📄 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `STRAVA_CLIENT_ID` | ✅ | Your Strava app Client ID |
| `STRAVA_CLIENT_SECRET` | ✅ | Your Strava app Client Secret |
| `STRAVA_REDIRECT_URI` | ✅ | Must match Strava app callback URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app's base URL |
| `SESSION_SECRET` | ✅ | 32+ char random string for cookie signing |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | ❌ | Optional, for future Mapbox integration |

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `next` 14 | App Router framework |
| `zustand` | Global state management |
| `puppeteer` | HTML → PNG screenshot export |
| `react-dropzone` | Drag & drop file upload |
| `react-colorful` | Lightweight color picker |
| `date-fns` | Date formatting |
| `sharp` | Server-side image optimization (optional) |

---

## License

MIT — build freely, run fast. 🏃‍♂️
