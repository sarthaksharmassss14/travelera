## Caching Strategy (Universal)
Implemented a centralized `cacheService` in `src/lib/cache.ts` using `localStorage` with configurable TTL (Time-To-Live).

| Data Type | Cache Key Structure | TTL (Duration) | Rationale |
| :--- | :--- | :--- | :--- |
| **Itinerary** | `itinerary:{source}:{dest}:{days}:{budget}` | 1 Week (168h) | AI generation is expensive and stable. |
| **Weather** | `weather:{dest}` | 24 Hours | Forecasts are stable for a single day. |
| **Country Data** | `country:{country}` | 30 Days (720h) | Cultural/Currency info changes very rarely. |

## 1. Groq AI (Itinerary Generation)
- **Model**: `llama-3-70b-versatile`.
- **Caching**: 7-day TTL. Prevents repeated token usage for identical trip parameters.

## 2. Open-Meteo (Weather)
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Params**: `latitude`, `longitude`, `daily=weathercode,temperature_2m_max,temperature_2m_min`, `timezone=auto`.
- **Caching**: Implemented 1-hour client-side caching using `localStorage` to reduce redundant API calls for the same destination.

## 3. Amadeus (Price Estimates)
- **Base URL**: `https://test.api.amadeus.com/v1`
- **Auth**: Client Credentials flow.
- **Endpoints**:
  - `/shopping/flight-offers` (for estimates)
  - `/reference-data/locations` (for IATA codes)
- **Constraint**: Use test environment keys.

## 4. REST Countries
- **Endpoint**: `https://restcountries.com/v3.1/name/{country}`
- **Data used**: Currency name, language, flags, and cultural snippets.

## 5. Supabase & Clerk
- **Sync**: Use Clerk's `userId` as the `user_id` in Supabase.
- **Storage**: Store the final itinerary JSON in the `itinerary` column of the `trips` table.
