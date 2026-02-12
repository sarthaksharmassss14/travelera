# Implementation Plan - AI Travel Planner

## 1. Project Overview
A premium, full-stack AI-powered travel planning application built with Next.js, Clerk, Supabase, and Groq AI.

## 2. Tech Stack & Tools
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Framer Motion (for premium feel).
- **UI Components**: shadcn/ui.
- **Authentication**: Clerk (with Supabase integration).
- **Backend/Database**: Supabase (PostgreSQL, Realtime).
- **AI Engine**: Groq (Llama-3-70b-versatile or similar) for itinerary generation.
- **Data APIs**: 
    - Open-Meteo (Weather)
    - REST Countries (Cultural/Currency data)
    - Amadeus (Flight/Hotel estimates)
- **Validation**: Playwright (E2E testing).

## 3. Database Schema (Supabase)
### `trips` table
- `id`: uuid (PK)
- `user_id`: text (Clerk User ID)
- `destination`: text
- `start_date`: date
- `end_date`: date
- `budget`: enum ('Cheap', 'Mid', 'Luxury')
- `itinerary`: jsonb (AI generated plan)
- `weather_data`: jsonb
- `cost_estimates`: jsonb
- `created_at`: timestamp

## 4. API Integration Strategy
- **Groq AI**: Server-side call via `/api/generate-itinerary`. Structured JSON response requested for timeline rendering.
- **Amadeus**: Test environment integration. Fetch flight/hotel price estimates based on destination and dates.
- **Open-Meteo**: Fetch coordinates from destination name (via geocoding search) then get 7-day forecast.
- **REST Countries**: Fetch data based on the destination country (currency name, symbol, language, flag).

## 5. UI/UX Design System
- **Theme**: Dark glassmorphism with vibrant accents (Indigo/Cyan).
- **Typography**: Inter / Outfit for a modern look.
- **Components**:
    - Multi-step Wizard with progress bar.
    - Vertical Timeline for daily activities.
    - Financial Dashboard for price breakdowns.
    - Floating Action Button (FAB) for AI chat/help.

## 6. Implementation Task List

### Milestone 1: Initialization & Foundation
- [x] Initialize Next.js project with Tailwind and shadcn/ui.
- [x] Setup Clerk Authentication.
- [x] Setup Supabase Client and Database schema.
- [x] Configure environment variables.

### Milestone 2: Core Infrastructure (APIs)
- [x] Implement Groq AI itinerary generator route.
- [x] Implement Open-Meteo weather service.
- [x] Implement REST Countries data fetcher.
- [x] Implement Amadeus price estimation logic.

### Milestone 3: Trip Wizard & State Management
- [x] Create Step 1: Destination Selection (with autocomplete if possible).
- [x] Create Step 2: Date Picker & Duration calculation.
- [x] Create Step 3: Budget Selection & Preferences.
- [x] Form validation and state persistence.

### Milestone 4: Itinerary Rendering & Dashboard
- [x] Build Vertical Timeline component for Daily Itinerary.
- [x] Build Weather Widget.
- [x] Build Price Estimator Dashboard.
- [x] Build Cultural Insights section.

### Milestone 5: Export & Polish
- [x] Implement "Travel Manifesto" export (Markdown/PDF).
- [x] Add animations and transitions (Framer Motion).
- [x] SEO optimization and accessibility checks.

### Milestone 6: Verification
- [x] Write Playwright E2E tests for the "Create Trip" flow.
- [!] Run browser-based validation (Environment block).
- [x] Final UI/UX polish.
