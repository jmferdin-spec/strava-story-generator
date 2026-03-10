# Deploying to Vercel

Complete guide to get your Strava Story Generator live on the internet.

---

## Overview of steps

1. Push your code to GitHub
2. Import the project on Vercel
3. Set your environment variables
4. Update Strava's callback URL
5. Deploy

Total time: ~15 minutes.

---

## Step 1 — Create a GitHub repository

If you don't have Git installed, download it from https://git-scm.com

Open your terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then go to https://github.com/new and create a **new empty repository** (don't add a README or .gitignore — keep it completely empty).

Copy the two commands GitHub shows you under "push an existing repository" — they look like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Run those in your terminal. Your code is now on GitHub.

---

## Step 2 — Import to Vercel

1. Go to https://vercel.com and sign in (or create a free account — you can sign in with GitHub directly)

2. Click **"Add New Project"**

3. Click **"Import"** next to your repository

4. Vercel auto-detects Next.js — leave all the build settings as-is

5. **Do not click Deploy yet** — you need to add environment variables first (next step)

---

## Step 3 — Add environment variables

Still on the Vercel import screen, scroll down to **"Environment Variables"**.

Add each of these one at a time:

| Name | Value |
|------|-------|
| `STRAVA_CLIENT_ID` | Your Strava app Client ID (numbers only) |
| `STRAVA_CLIENT_SECRET` | Your Strava app Client Secret |
| `STRAVA_REDIRECT_URI` | `https://YOUR-PROJECT.vercel.app/api/strava/callback` |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-PROJECT.vercel.app` |
| `SESSION_SECRET` | A random 32+ character string (see below) |

**To generate SESSION_SECRET**, run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as the value.

**Note:** You don't know your Vercel URL yet at this point. Use a placeholder like
`https://strava-story.vercel.app` — you'll update it after the first deploy in Step 5.

Click **Deploy**.

---

## Step 4 — Update Strava's callback URL

After the deploy completes, Vercel gives you your real URL (something like `strava-story-abc123.vercel.app`).

### 4a — Update in Strava

1. Go to https://www.strava.com/settings/api
2. Find your app and click **Edit**
3. Set **Authorization Callback Domain** to your Vercel domain, e.g.:
   ```
   strava-story-abc123.vercel.app
   ```
   (just the domain, no `https://` prefix, no path)
4. Save

### 4b — Update in Vercel

1. Go to your project on vercel.com
2. Click **Settings → Environment Variables**
3. Update `STRAVA_REDIRECT_URI` to:
   ```
   https://strava-story-abc123.vercel.app/api/strava/callback
   ```
4. Update `NEXT_PUBLIC_APP_URL` to:
   ```
   https://strava-story-abc123.vercel.app
   ```

### 4c — Redeploy to pick up the new env vars

Go to **Deployments** tab → click the three dots on the latest deployment → **Redeploy**.

---

## Step 5 — Test it

Open your Vercel URL in a browser. You should see the landing page. Click **Connect with Strava**, authorize, and you're in.

---

## ⚠️ Important: Export function timeout

The **Export PNG** feature uses a headless browser (Chromium) to render your story — this takes 5–15 seconds.

| Vercel Plan | Function timeout | Export works? |
|-------------|-----------------|---------------|
| **Hobby** (free) | 10 seconds | ⚠️ May time out on complex stories |
| **Pro** ($20/mo) | 60 seconds | ✅ Reliable |

**If you're on the free plan and export times out:**
- Try simpler overlays (Solid instead of Duotone)
- Turn off route rendering for the export
- Or upgrade to Vercel Pro

The editor preview always works fine — it's only the PNG export that uses the heavy browser function.

---

## Custom domain (optional)

In Vercel → Settings → Domains, you can add your own domain like `stories.yourname.com` for free. Vercel handles the SSL certificate automatically.

---

## Keeping it updated

Whenever you make changes to the code:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel automatically re-deploys within about 60 seconds.

---

## Troubleshooting

### "Authorization callback domain mismatch"
Your `STRAVA_REDIRECT_URI` in Vercel env vars doesn't match what's in your Strava app settings, or vice versa. Double-check both — they must match exactly.

### "Failed to generate story" on export
- Check Vercel function logs: Project → Functions tab → click the `generate-story` function
- Most common cause: function timed out (see timeout table above)
- Second common cause: `@sparticuz/chromium` failed to start — check if memory is set to 1024MB in vercel.json

### Strava shows "access denied"
Make sure your Strava app's Authorization Callback Domain is just the bare domain (e.g. `strava-story.vercel.app`) without `https://` or any path.

### Environment variables not taking effect
After changing env vars in Vercel, you must redeploy. Go to Deployments → Redeploy on the latest deployment.
