# PetMatch Home Score

**Evaluate how suitable a property is for a homebuyer's pets** — powered by AI, neighborhood data, and transparent scoring.

Built for real estate agents who want to help pet-owning clients make confident decisions.

---

## What It Does

1. **Input a property** — address, listing description, beds/baths/sqft, lot size, photos, agent notes
2. **Add pet profiles** — species, breed, age, size, activity level, anxiety, escape risk, mobility issues
3. **Get a scored report** — overall 0–100 score with 6 sub-scores, red flags, highlights, buyer summary, and agent notes
4. **Visualize your pet** — AI-generated images of your pet in different areas of the property
5. **Print & share** — client-ready printable report with your branding

## Scoring Categories

| Category | What It Measures |
|---|---|
| Traffic Safety | Proximity to highways, busy roads, dangerous intersections |
| Yard Suitability | Fenced yard, lot size, shade, outdoor space |
| Senior Comfort | Single-story, stairs, smooth floors, warm resting areas |
| Exercise Friendliness | Nearby parks, trails, walkability, yard size |
| Indoor Comfort | Natural light, windows, open layout, climate |
| Noise & Stress | Highway noise, urban noise, quiet environment |

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** throughout
- **Tailwind CSS** for styling
- **Supabase** for auth, database, storage
- **OpenAI GPT-4o** for AI analysis and DALL-E for pet visualization
- **Google Maps APIs** for geocoding and nearby places
- **Zod** for validation

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) OpenAI API key
- (Optional) Google Maps API key

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/petmatch-home-score.git
cd petmatch-home-score

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Set up the database
# Run supabase/schema.sql in your Supabase SQL Editor
# Optionally run supabase/seed.sql for sample data

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `OPENAI_API_KEY` | No | Enables AI-powered analysis and pet visualization |
| `GOOGLE_MAPS_API_KEY` | No | Enables real geocoding and neighborhood data |
| `NEXT_PUBLIC_APP_URL` | No | Your app URL (defaults to localhost:3000) |

### Without API Keys

The app works with **zero optional API keys**:
- **No OpenAI key** → Uses a deterministic rule-based scoring engine that analyzes listing keywords, property features, and pet profiles
- **No Google Maps key** → Uses mock geocoding data with realistic neighborhood context

Add keys later for full AI-powered analysis and real geospatial data.

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated routes with sidebar
│   │   ├── dashboard/      # Property cards with scores
│   │   ├── analyses/
│   │   │   ├── new/        # 3-step analysis form
│   │   │   └── [id]/       # Report view + print view
│   │   └── settings/       # Branding configuration
│   ├── api/
│   │   ├── analyses/       # Create + rerun analysis
│   │   ├── auth/callback/  # OAuth callback
│   │   └── visualize/      # Pet scene generation
│   └── login/              # Sign in / sign up
├── components/
│   ├── layout/             # App shell with sidebar
│   ├── ui/                 # Reusable components
│   └── pet-visualizer.tsx  # AI visualization component
├── lib/
│   ├── supabase/           # Client + server Supabase setup
│   ├── database.ts         # Typed CRUD helpers
│   ├── validations.ts      # Zod schemas
│   └── mock-data.ts        # Development mock data
├── services/
│   ├── ai.ts               # OpenAI analysis with fallback
│   ├── maps.ts             # Google Maps geocoding + nearby search
│   ├── scoring-fallback.ts # Rule-based scoring engine
│   └── pet-visualizer.ts   # DALL-E scene generation
└── types/
    └── database.ts         # All TypeScript interfaces

supabase/
├── schema.sql              # Full database schema with RLS
└── seed.sql                # Sample data
```

## Database

5 tables with Row Level Security:

- **properties** — address, listing details, coordinates
- **pet_profiles** — species, breed, age, size, activity, anxiety, escape risk
- **analyses** — scores, red flags, highlights, AI summary, agent notes
- **analysis_photos** — uploaded listing photos
- **user_settings** — report branding name

## License

MIT
