# Vercel Deployment Guide

## Problem Identified and Fixed

Your project was configured with `@astrojs/node` adapter (for standalone Node.js servers), but **Vercel requires the `@astrojs/vercel` adapter** for its serverless platform. This was causing the 404: NOT_FOUND error.

## Changes Made

### 1. **Installed Vercel Adapter**
```bash
npm install @astrojs/vercel
```

### 2. **Updated `astro.config.mjs`**
Changed from Node adapter to Vercel adapter:
```javascript
// Before (Node adapter - for VPS/Railway)
import node from '@astrojs/node';
adapter: node({ mode: 'standalone' })

// After (Vercel adapter - for Vercel serverless)
import vercel from '@astrojs/vercel';
adapter: vercel()
```

### 3. **Updated `src/pages/index.astro`**
Changed from static pre-rendering to server-side rendering for real-time job data:
```javascript
// Before
export const prerender = true;  // Static at build time

// After
export const prerender = false;  // Dynamic at request time
```

### 4. **Simplified `vercel.json`**
Vercel auto-detects Astro projects, so minimal configuration is needed:
```json
{
  "framework": "astro",
  "buildCommand": "npm run build"
}
```

### 5. **Updated `.gitignore`**
Added `.vercel/` directory to exclude build output from git.

## Deployment to Vercel

### Step 1: Push Your Changes
```bash
# Already done - your changes are pushed to:
# branch: claude/create-markdown-file-011CUdTw65DVXTiGXtxbnE39
```

### Step 2: Set Up Environment Variables in Vercel

**CRITICAL:** Before deploying, add these environment variables in your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables for **All Environments** (Production, Preview, Development):

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PUBLIC_SITE_URL=https://your-domain.vercel.app
```

**Where to find Supabase keys:**
- Go to your Supabase project
- **Settings → API**
- Copy `URL`, `anon public` key, and `service_role` key

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..." → Project**
3. Import your GitHub repository: `datanalytics86/mi-portal-de-empleo`
4. Configure project:
   - **Framework Preset:** Astro (auto-detected)
   - **Root Directory:** `portal-empleos-chile`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.vercel/output` (auto-detected)
5. Add environment variables (see Step 2 above)
6. Click **Deploy**

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Navigate to project directory
cd portal-empleos-chile

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 4: Configure Supabase for Production

After deployment, update Supabase with your Vercel URL:

1. Go to your Supabase project
2. **Settings → API → URL Configuration**
3. Add your Vercel domain to **Allowed URLs:**
   - `https://your-domain.vercel.app`
   - `https://*.vercel.app` (for preview deployments)
4. **Authentication → URL Configuration:**
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/**`

## Build Verification

The build now completes successfully with the Vercel adapter:

```
✓ Completed in 290ms
[@astrojs/vercel] Bundling function
[@astrojs/vercel] Copying static files to .vercel/output/static
[build] Complete!
```

## Output Structure

The Vercel adapter generates the correct output structure:

```
.vercel/output/
├── config.json          # Vercel routing configuration
├── functions/           # Serverless functions
│   └── _render.func/    # Main render function
├── static/              # Static assets (_astro/, images, etc.)
└── server/              # Server-side code
```

## Testing Locally

To test the build locally:

```bash
# Build
npm run build

# Preview (requires environment variables in .env)
npm run preview
```

## Common Issues and Solutions

### Issue: "Missing Supabase environment variables" during build

**Solution:** This error during local builds without `.env` is expected. On Vercel, ensure environment variables are set in the project settings (Step 2 above).

### Issue: "404 on deployed site"

**Solution:**
1. Check that environment variables are set in Vercel
2. Verify the build logs show no errors
3. Ensure the root directory is set to `portal-empleos-chile`

### Issue: "Database connection failed"

**Solution:**
1. Verify Supabase URL and keys are correct
2. Check that your Vercel domain is added to Supabase's allowed URLs
3. Verify RLS policies are active in Supabase

### Issue: "Authentication not working"

**Solution:**
1. Update Supabase authentication URLs with your Vercel domain
2. Check that cookies are allowed (HTTP-only cookies require HTTPS)
3. Verify that the `PUBLIC_SITE_URL` environment variable is set correctly

## Next Steps

After successful deployment:

1. **Test Authentication:** Try logging in as an employer
2. **Test Job Creation:** Create a new job posting
3. **Test Applications:** Submit a test application
4. **Verify CV Downloads:** Check that CV downloads work with signed URLs
5. **Monitor Logs:** Check Vercel Function Logs for any runtime errors

## Architecture Notes

### Why Vercel Adapter?

- **Node Adapter** (`@astrojs/node`): For standalone Node.js servers (VPS, Railway, Render)
- **Vercel Adapter** (`@astrojs/vercel`): For Vercel's serverless platform with edge functions

### Server-Side Rendering

The project uses `output: 'server'` mode, which means:
- All pages are rendered on-demand at request time
- Dynamic data fetching from Supabase works correctly
- Authentication state is checked on each request
- No stale data from build time

### Why `prerender: false` for index.astro?

Job listings should be dynamic and up-to-date, not baked into static HTML at build time. With `prerender: false`, each visitor sees the latest job postings from the database.

## Support

If you encounter issues:

1. Check Vercel Function Logs: **Vercel Dashboard → Your Project → Deployments → [Latest] → Functions**
2. Check build logs for errors
3. Verify all environment variables are set correctly
4. Test locally with `npm run preview` to isolate issues

---

**Build Status:** ✅ Ready for deployment
**Last Updated:** October 31, 2025
**Commit:** 4827c38 - "fix: Configure project for Vercel deployment"
