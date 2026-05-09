# PetMatch Home Score — Product Requirements Document

**Version:** 1.0
**Last Updated:** 2026-05-08
**Status:** Active — Source of Truth for all development

---

## 1. Product Vision

PetMatch Home Score helps real estate agents evaluate how suitable a property is for homebuyers who own pets. An agent enters property details and pet profiles, and the platform produces a scored, explainable report they can share with clients. The report covers safety, yard quality, indoor comfort, exercise access, noise stress, and senior pet comfort — personalized to the specific animals involved.

### 1.1 Target Users

| Persona | Need |
|---------|------|
| **Real estate agent** (primary) | Differentiate their service by offering pet-focused property analysis to pet-owning clients |
| **Buyer's agent** | Help clients with dogs/cats evaluate listings before showings |
| **Listing agent** | Market pet-friendly features of a listing; generate "Pet Score" badges for marketing materials |

### 1.2 Value Proposition

- No tool exists that combines property data + pet profiles + geospatial context + AI to produce a shareable pet-suitability report.
- Agents who serve pet owners gain a memorable, shareable deliverable.
- The "visualize your pet here" feature creates emotional connection to the property.

---

## 2. Core Workflows

### WF-1: Authentication

| Step | Description |
|------|-------------|
| 1 | User lands on `/login` |
| 2 | Signs up or signs in via email + password (Supabase Auth) |
| 3 | On success, redirected to `/dashboard` |
| 4 | Session persisted via cookies; middleware protects all `/dashboard`, `/analyses/*`, `/settings` routes |
| 5 | Sign out clears session, returns to `/login` |

**Edge cases:**
- Invalid credentials → inline error message
- Email not confirmed → Supabase handles confirmation flow
- Session expired → middleware redirects to `/login`
- Demo mode (no Supabase configured) → bypass auth, use mock data, show banner

### WF-2: Create New Analysis

| Step | Description |
|------|-------------|
| 1 | User clicks "New Analysis" from dashboard |
| 2 | **Step 1 — Property Details**: Address, beds/baths/sqft, lot size, property type, stories, flooring, fencing, pet amenities (mudroom, pet door, wash station, screened porch, pool), built-in pet features, HOA policies, description, notes |
| 3 | **Step 2 — Pet Profiles**: Add 1+ pets with name, species (dog/cat), breed, age, size, activity level, indoor/outdoor, mobility limitations, anxiety sensitivity, escape risk, notes, optional photo |
| 4 | **Step 3 — Review & Submit**: Summary of all inputs; optional photo uploads of the property |
| 5 | On submit: POST to `/api/analyses` |
| 6 | Backend: create property row → create pet rows → upload photos → geocode address → find nearby places → run AI analysis (or fallback) → save analysis row |
| 7 | Redirect to `/analyses/[id]` to view the report |

**Edge cases:**
- No pets added → block submission with validation error
- Address cannot be geocoded → use mock/zero coordinates, still produce analysis
- OpenAI unavailable → fallback scoring engine produces deterministic report
- Google Maps unavailable → mock map context (still analyses)
- Photo upload fails → analysis still created, photos skipped with warning
- Very long listing description → truncated in AI prompt to stay within token limits

### WF-3: View Analysis Report

| Step | Description |
|------|-------------|
| 1 | User clicks analysis from dashboard or navigates to `/analyses/[id]` |
| 2 | Full report displays: overall score ring, 6 dimension scores with explanations, red flags, highlights, AI summary, species-specific insights (dog/cat), marketing tips, upgrade suggestions |
| 3 | "Visualize Your Pet" section shows available scenes; clicking generates DALL-E image |
| 4 | "Re-run Analysis" button re-analyzes with latest AI/map data |
| 5 | "Print Report" link opens print-optimized view |

**Edge cases:**
- Analysis not found → 404 or redirect to dashboard
- Analysis belongs to different user → RLS blocks access, show error
- DALL-E unavailable → show "AI visualization unavailable" message, not a crash
- Species is neither dog nor cat → show generic pet icon, not cat icon

### WF-4: Print / Share Report

| Step | Description |
|------|-------------|
| 1 | From analysis detail, click "Print Report" |
| 2 | Opens `/analyses/[id]/print` — clean, print-optimized layout |
| 3 | Shows: branding name, property address, overall score, 6 dimension scores, red flags, highlights, summary, species insights, marketing tips, upgrade suggestions |
| 4 | User uses browser print → PDF |

### WF-5: Dashboard

| Step | Description |
|------|-------------|
| 1 | Shows all properties the user has analyzed |
| 2 | Each card shows: address, latest overall score, pet names, date |
| 3 | Click card → navigates to latest analysis |
| 4 | "New Analysis" button to create |

**Edge cases:**
- No analyses yet → empty state with CTA
- Many analyses → should paginate or scroll gracefully

### WF-6: Settings

| Step | Description |
|------|-------------|
| 1 | User sets their branding name (appears on printed reports) |
| 2 | Saved to `user_settings` table |

---

## 3. Technical Requirements

### 3.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Auth & DB | Supabase (PostgreSQL + Auth + Storage) |
| AI Analysis | OpenAI GPT-4o (with rule-based fallback) |
| Pet Visualization | OpenAI DALL-E 3 |
| Geospatial | Google Maps Geocoding + Places API |
| Validation | Zod |
| Deployment | GitHub Pages / Netlify / custom (NOT Vercel) |

### 3.2 Database Schema Requirements

The SQL schema MUST match the TypeScript `Property` interface exactly. Required columns on `properties`:

```
id, user_id, address, city, state, postal_code, latitude, longitude,
listing_description, beds, baths, sqft, lot_size, property_type, notes,
stories, flooring_type, fencing_type,
has_mudroom, has_pet_door, has_pet_wash_station, has_screened_porch,
has_pool, has_built_in_pet_features, built_in_pet_features_desc,
hoa_has_restrictions, hoa_pet_policy, hoa_breed_restrictions, hoa_pet_limit,
created_at, updated_at
```

Required columns on `analyses`:

```
id, property_id, user_id, overall_score,
traffic_safety_score, yard_score, senior_comfort_score,
exercise_score, indoor_comfort_score, noise_stress_score,
red_flags_json, highlights_json, ai_summary, agent_notes,
scoring_details_json, map_context_json,
species_insights_json, marketing_tips_json, upgrade_suggestions_json,
created_at, updated_at
```

### 3.3 API Route Requirements

| Endpoint | Auth | Body | Response |
|----------|------|------|----------|
| `POST /api/analyses` | Required | multipart (property + pets + photos) | `{ analysis_id }` |
| `POST /api/analyses/[id]/rerun` | Required | none | `{ success, analysis }` |
| `POST /api/visualize` | Required | `{ analysis_id, pet_id, scene_id }` | `{ image_url }` |
| `GET /api/auth/callback` | Public | query params | redirect |

### 3.4 Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for production) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (for production) | Supabase anonymous key |
| `OPENAI_API_KEY` | Optional | Enables AI analysis + DALL-E; fallback scoring without it |
| `GOOGLE_MAPS_API_KEY` | Optional | Enables real geocoding + places; mock data without it |
| `NEXT_PUBLIC_APP_URL` | Optional | App base URL for OAuth callbacks |

### 3.5 Demo Mode

When `NEXT_PUBLIC_SUPABASE_URL` is missing or equals the placeholder:
- Middleware bypasses auth, redirects `/login` → `/dashboard`
- Dashboard, analysis detail, and print pages use mock data
- New Analysis form renders but submission shows a "demo mode" toast instead of hitting the API
- Settings page shows banner and simulates save
- All API routes return appropriate demo responses or are gracefully skipped

---

## 4. Scoring Model

### 4.1 Dimensions (0–100 each)

| Dimension | What it measures |
|-----------|-----------------|
| Traffic Safety | Distance from busy roads, cul-de-sac, speed limits, sidewalks |
| Yard & Outdoor | Lot size, fencing type/quality, yard access, pool risk |
| Senior Pet Comfort | Single-story access, flooring slip risk, temperature, mudroom |
| Exercise Access | Nearby parks, trails, dog parks, walkability |
| Indoor Comfort | Sqft per pet, flooring type, pet door, wash station, layout |
| Noise & Stress | Highway proximity, flight paths, construction, neighborhood type |

### 4.2 Overall Score

Weighted average of the 6 dimensions. Weights shift based on pets:
- Dogs: heavier weight on Yard, Exercise, Traffic Safety
- Cats: heavier weight on Indoor Comfort, Noise & Stress, Senior Comfort
- Mixed household: balanced weights

### 4.3 Output

- 6 dimension scores with explanations
- Overall weighted score
- Red flags (dealbreakers or serious concerns)
- Highlights (standout features)
- AI narrative summary
- Species-specific insights (per dog, per cat)
- Marketing tips (for listing agents)
- Upgrade suggestions (ROI-ranked improvements)

---

## 5. UI/UX Requirements

### 5.1 Design System

- **Colors:** Brand teal (`#0d9488`), sage greens, warm neutrals
- **Typography:** System font stack, clean hierarchy
- **Components:** Consistent card-based layout, score rings with color coding (green >70, amber 40-70, red <40)
- **Responsive:** Mobile-first, sidebar collapses to bottom nav on mobile
- **Loading states:** Skeleton loaders or spinners for async operations
- **Error states:** Inline error messages, toast notifications for transient errors
- **Empty states:** Helpful illustrations/copy with clear CTAs

### 5.2 Page Requirements

**Login:** Clean, centered form. Email + password fields. Sign up / sign in toggle. Error display.

**Dashboard:** Grid of property cards. Each shows address, score badge, pet avatars, date. Empty state when no analyses. "New Analysis" prominent CTA.

**New Analysis (wizard):** 3-step progress indicator. Back/Next navigation. Form validation on each step before advancing. Clear section grouping. Toggle chips for boolean fields. Review step shows all entered data before submission. Loading state during submission.

**Analysis Detail:** Hero section with overall score ring + address. 6 score cards in grid. Expandable sections for red flags, highlights, AI summary. Species insights in tabbed or side-by-side layout. Marketing tips as actionable list. Upgrade suggestions with estimated ROI. Pet visualizer section. Action buttons: Re-run, Print.

**Print Report:** No sidebar/navigation. Clean white background. Branding name at top. All scores and content. Page-break friendly CSS. No interactive elements.

**Settings:** Simple form. Save button with success feedback.

---

## 6. Milestones & Success Criteria

### M0: Foundation (DONE)
- [x] Next.js project scaffolded
- [x] All pages created with routing
- [x] UI components built
- [x] TypeScript types defined
- [x] Scoring fallback engine complete
- [x] AI service with prompts complete
- [x] Maps service complete
- [x] Mock data for demo mode
- [x] Initial git commit

### M1: Schema Alignment & Data Integrity
- [ ] SQL schema updated to include ALL property columns (stories, flooring, fencing, pet amenities, HOA fields)
- [ ] SQL schema updated to include ALL analysis columns (species_insights_json, marketing_tips_json, upgrade_suggestions_json)
- [ ] API route (POST /api/analyses) persists ALL new fields correctly
- [ ] API route (POST /api/analyses/[id]/rerun) persists ALL new fields correctly
- [ ] Seed data updated to match expanded schema
- [ ] TypeScript types verified 1:1 with SQL schema

### M2: Supabase Connected
- [ ] Supabase project created
- [ ] Schema migration applied
- [ ] .env.local created with real credentials
- [ ] Auth flow works end-to-end (sign up, sign in, sign out, session persistence)
- [ ] CRUD operations work through UI
- [ ] RLS policies verified (user can only see own data)
- [ ] Storage bucket created and photo uploads work

### M3: GitHub Repository
- [ ] Repo created on GitHub
- [ ] Code pushed
- [ ] .env.local NOT committed (in .gitignore)
- [ ] README accurate

### M4: Full Workflow Testing
- [ ] WF-1 (Auth): Sign up, sign in, session persists across refresh, sign out, protected routes redirect
- [ ] WF-2 (Create): Full wizard → submit → analysis created in DB → redirect to report
- [ ] WF-3 (View): Report loads all sections, scores display correctly, visualizer works (with OpenAI key)
- [ ] WF-4 (Print): Clean layout, all data present, prints cleanly to PDF
- [ ] WF-5 (Dashboard): Shows all user's analyses, links work, empty state works for new users
- [ ] WF-6 (Settings): Save and load branding name

### M5: Polish & Edge Cases
- [ ] Error handling: network failures, API errors, invalid data all handled gracefully
- [ ] Loading states: all async operations show appropriate feedback
- [ ] Form validation: all required fields enforced, helpful error messages
- [ ] Mobile responsive: all pages usable on phone screens
- [ ] Demo mode: all pages work with mock data, clear banners, no crashes
- [ ] Demo mode: "New Analysis" shows informative message instead of crashing
- [ ] Species icon: non-dog species don't all show cat icon
- [ ] Print report: includes species insights, marketing tips, upgrade suggestions
- [ ] No console errors in normal operation

---

## 7. Known Issues (from Audit)

These MUST be resolved before M2:

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | SQL `properties` table missing 15+ columns that forms/API expect | **Critical** | Update schema.sql with all Property fields |
| 2 | SQL `analyses` table missing `species_insights_json`, `marketing_tips_json`, `upgrade_suggestions_json` | **Critical** | Add columns to schema |
| 3 | `POST /api/analyses` never persists species_insights, marketing_tips, upgrade_suggestions to DB | **Critical** | Update insert to include these fields |
| 4 | Demo mode: "New Analysis" submit hits API which returns 401 | **High** | Add demo mode handling in wizard submit |
| 5 | Print report missing species insights, marketing tips, upgrade suggestions sections | **Medium** | Add sections to print-report-client.tsx |
| 6 | Species icon shows Cat for all non-dog species | **Low** | Add generic pet icon fallback |
| 7 | `createServiceClient` exported but never used | **Low** | Remove or document |
| 8 | Seed data doesn't include extended property fields | **Medium** | Update seed.sql |

---

## 8. Out of Scope (v1)

- Multi-tenant / team features
- Paid subscriptions or billing
- Email delivery of reports (PDF export via browser print is sufficient)
- Mobile native app
- MLS integration / automatic listing import
- Vercel deployment (explicitly excluded per user)
- Real-time collaboration
- Pet breed database / auto-complete
