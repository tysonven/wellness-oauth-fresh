# Developer Onboarding & Project Overview

## Project: Wellness OAuth Integration (Go High Level/FlowOS ↔ WellnessLiving)

---

## 1. Recent Work & Fixes (July 2025)

- **Migrated all modules to ESM (ECMAScript Modules) for Next.js/Vercel compatibility.**
- **Fixed all import/export issues:**
  - All files now use `import`/`export` (no CommonJS `require`/`module.exports`).
  - `.mjs` used for ESM-only modules where needed.
- **Resolved build errors on Vercel:**
  - All routes and API endpoints now build and deploy successfully.
- **Verified that all key flows (OAuth, Supabase, Puppeteer, Data Mapping) are ready for further development and testing.**

---

## 2. Project Structure & Key Files

- **OAuth Flow:**
  - `src/app/api/oauth-callback/route.js` — Handles OAuth callback, exchanges code for token, saves to Supabase.
- **Supabase Integration:**
  - `lib/supabaseClient.js` — Supabase client setup.
  - `lib/tokenManager.js` — Token save/retrieve helpers.
- **Puppeteer Integration:**
  - `fetch_business_info_with_token_puppeteer.mjs` — Example Puppeteer script for WellnessLiving.
- **Data Mapping:**
  - `src/lib/data_mapper.mjs` — All mapping functions (ESM, named exports).
- **Performance Utilities:**
  - `src/lib/performance_optimization.js` — Pagination, rate limiting, batching, caching (ESM, named exports).
- **API Endpoints:**
  - `src/app/api/wellness-living/` — All WellnessLiving-related endpoints (auth, business, classes, sync, etc).
  - `src/app/api/debug-wl-api/route.js` — Debug endpoint for API testing.

---

## 3. Key Flows

### A. Go High Level Marketplace Install
- User installs the app via GHL marketplace.
- User is redirected to this app for OAuth.
- OAuth code is exchanged for a token and saved in Supabase.

### B. Data Sync & Puppeteer
- Puppeteer scripts can use the stored token to fetch data from WellnessLiving.
- Data is mapped using `data_mapper.mjs` and sent to GHL/FlowOS as needed.

---

## 4. What’s Working & What to Test
- **Builds and deploys cleanly on Vercel.**
- **OAuth flow should save tokens to Supabase (check table/schema/credentials).**
- **Puppeteer scripts should run and fetch data (test locally or in serverless).**
- **API endpoints are accessible and ready for further development.**

---

## 5. Handoff Tips for New Developers
- **All code is ESM/Next.js/Vercel compatible.**
- **No CommonJS remains.**
- **Key files and flows are listed above.**
- **Start by testing the OAuth flow and checking Supabase for token storage.**
- **Check Vercel and Supabase logs for troubleshooting.**
- **Use the debug endpoint for API testing.**
- **If you add new modules, use ESM (`export`/`import`).**

---

## 6. Next Steps / TODOs
- [ ] Test full OAuth flow from GHL to Supabase.
- [ ] Test Puppeteer data fetch and mapping.
- [ ] Expand/finish API endpoints as needed.
- [ ] Add more robust error handling/logging.
- [ ] Update this doc as the project evolves.

---

## 7. Resources
- [Integration Overview](docs/Integration%20Overview.md)
- [Technical Documentation](docs/Technical%20Documentation.md)
- [Troubleshooting Guide](docs/Troubleshooting%20Guide.md)
- [WellnessLiving API Docs](https://developers.wellnessliving.com/)
- [GHL API Docs](https://developers.gohighlevel.com/)

---

**Welcome aboard! If you have questions, check this doc, the code comments, or reach out to the project maintainer.** 
