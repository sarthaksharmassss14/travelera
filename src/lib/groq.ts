import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Resolves a broad location (Country/State) to its primary international gateway city.
 */
export async function resolveGateway(location: string): Promise<string> {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a travel expert. Convert the given location into the name of its SINGLE most important international airport hub city. If it is already a city, return it as is. Respond with ONLY the city name.",
        },
        {
          role: "user",
          content: location,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content?.trim() || location;
  } catch {
    return location;
  }
}

/**
 * Extracts structured data from a natural language travel query.
 * Includes a safety check to ensure the query is travel-related.
 */
export async function parseUserQuery(query: string) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a travel query parser. 
        First, evaluate if the user's query is related to travel, tourism, vacation planning, or exploring places.
        If the query is IRRELEVANT (e.g., asking for medical advice, cooking human organs, toxic content, or random non-travel facts), set 'isTravelRelated' to false.
        
        If it IS travel-related:
        1. Extract travel details.
        2. If a detail is missing, guess a reasonable default.
        3. For 'budget', map it to 'Cheap', 'Mid', or 'Luxury'.
        4. For 'destination', if it's a mood, pick a specific famous city.
        
        Return ONLY valid JSON in this format:
        {
          "isTravelRelated": boolean,
          "rejectionMessage": "string" (only if isTravelRelated is false, explain politely why),
          "sourceCity": "string",
          "destination": "string",
          "days": number,
          "budget": "Cheap" | "Mid" | "Luxury",
          "travelers": number,
          "vibe": "string"
        }`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

  if (result.isTravelRelated === false) {
    throw new Error(result.rejectionMessage || "I can only help with travel-related queries. Please ask me about trips, destinations, or itineraries!");
  }

  return result;
}

export async function generateItinerary(
  destination: string,
  days: number,
  budget: string,
  sourceCity: string,
  researchContext: string,
  realFlightPriceINR?: number,
  travelers: number = 1,
  exchangeRate: number = 90,
  vibe?: string,
  realHotelPriceINR?: number // Naya parameter
) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from .env.local");
  }

  const flightInfo = realFlightPriceINR
    ? `Confirmed Real Flight Price: ₹${realFlightPriceINR.toLocaleString('en-IN')}.`
    : `Estimate based on typical 2026 rates.`;

  const hotelInfo = realHotelPriceINR
    ? `Confirmed Real Hotel Stay Price (Total for ${days} days): ₹${realHotelPriceINR.toLocaleString('en-IN')}.`
    : `Estimate realistic hotel price.`;

  const vibeInfo = vibe ? `The trip should have a "${vibe}" vibe.` : "";

  const prompt = `You are a professional travel planner. 
  TRIP SCOPE: From ${sourceCity} to ${destination} for ${days} days for ${travelers} travelers.
  Budget: ${budget}.
  ${vibeInfo}
  
  ### MULTI-CITY RULE (CRITICAL):
  - If the trip is longer than 7 days and the destination is a country or a large region (like Europe, Rajasthan, South East Asia), plan a MULTI-CITY tour. 
  - Mention city changes clearly in the daily_plans.

  ### ACTIVITY RULES:
  - Day 1 MUST start at the DESTINATION (${destination}), NOT the source city (${sourceCity}). 
  - Do not include activities in ${sourceCity}. Assume the traveler has already arrived at the destination on Day 1 morning/afternoon.
  
  ### STRICT 3-TIER CATEGORIZATION (CRITICAL):
  Categorize the entire itinerary into [Cheap, Mid, Lux] based on the requested 'budget' (${budget}).

  1. INTER-CITY TRANSPORT (Between Cities):
     - IF LAND JOURNEY POSSIBLE (e.g., Delhi to Jaipur, Manali, Srinagar, Mumbai):
       - Cheap: Sleeper Class Train. (If no train, use Buses). STRICT RULE: NEVER SUGGEST FLIGHTS FOR CHEAP LAND JOURNEYS.
       - Mid: 3AC Class Train or Budget Economy Flight.
       - Lux: Business Class Flight or 2AC Train (if no flight). Private Cabs if neither exists.
     - IF LAND JOURNEY IMPOSSIBLE (Overseas/Cross-Ocean):
       - Cheap & Mid: Budget Economy Flights.
       - Lux: Business Class Flights.
     - Multi-City: Prioritize Trains for land-possible routes; use Flights otherwise.

  2. INTRA-CITY TRANSPORT (Within City):
     - Cheap: Metro, shared taxis, local buses.
     - Mid: Scooter/Bike rentals or app-based cabs (Uber/Ola).
     - Lux: Full-day private car rentals or chauffeured cabs.

  3. DAILY FOOD BUDGET (Per Person in INR):
     - WITHIN INDIA: Cheap: ₹500/day | Mid: ₹800/day | Lux: ₹1,500/day.
     - OUTSIDE INDIA: Use realistic local rates for the tier, converted to INR.

  ### GEOGRAPHY & LABELS (STRICT):
  - If the destination is a State (e.g., Gujarat, Kerala) and you are in a city (e.g., Ahmedabad, Kochi), NEVER say "Local Bus: Ahmedabad to Gujarat". Use "Local transport in Ahmedabad" or "Intra-state travel".

  4. SIGHTSEEING & ATTRACTIONS LOGIC:
     - Cheap (The Explorer): Focus on free landmarks, parks, street markets. RULE: Max 1 iconic paid ticket per city (e.g., Taj Mahal). Use base government rates.
     - Mid (Experience Seeker): Popular paid attractions, guided group tours, skip-the-line entries. Include one "medium" activity (e.g., cooking class).
     - Lux (The VIP): Private guided tours, exclusive experiences (helicopter, private yacht, hot air balloon). Prioritize private transport to the attraction.

  5. ATTRACTION BUDGET BENCHMARKS (Per Person):
     - INDIA:
        - Cheap: Min ₹200 - ₹500 /day (Focus on 1 iconic ticket).
        - Mid: ₹1,000 - ₹2,000 /day.
        - Lux: ₹3,000+ /day.
     - Outside India:
        - Cheap: ₹500 - ₹1,000 /day.
        - Mid: ₹2,500 - ₹5,000 /day.
        - Lux: ₹10,000+ /day.

  6. ACCOMMODATION & STAY LOGIC (Amadeus-Style):
     - Cheap (Economy/Hostel): Prioritize Hostels or 1-2 Star budget hotels (e.g., Zostel, Treebo).
     - Mid (Comfort/Boutique): 3-4 Star hotels with breakfast (e.g., Lemon Tree, Ibis).
     - Lux (Premium/Luxury): 5-Star Luxury/Heritage hotels (e.g., Taj, Marriott, Hilton).

  ### FALLBACK ESTIMATES (Use ONLY if REAL ANCHORS below are missing or 0):
  - India: Cheap: ₹1k/night | Mid: ₹5k/night | Lux: ₹15k+/night.
  - Outside: Cheap: ₹3k/night | Mid: ₹10k/night | Lux: ₹30k+/night.
      

  ### DATA RULES:
  - ALL PRICING MUST BE TOTAL FOR ${travelers} PEOPLE.
  - "main_travel": MUST be the TOTAL ROUND-TRIP cost for all ${travelers} people.
  - LABELS: Labels like "Sleeper Class Train" or "Volvo Bus" MUST explicitly say "Round-trip" (e.g., "Round-trip Sleeper Class Train Fare").
  - LAND MATH (CRITICAL): If a train ticket is ₹1,000 per person one-way, for ${travelers} people ROUND-TRIP, the estimate MUST be ₹${1000 * travelers * 2}. 
    - Example: Delhi to Kerala (2 people, Sleeper Round-trip) = ₹4,000+. NOT ₹1,000.

  ### ITINERARY RULES:
  - 3 activities/day: Morning, Afternoon, Evening. 
  - Descriptions: Informative but concise (15-20 words).
  - Use specific POI names for "location".

   Research (Context): ${researchContext.substring(0, 800)}

   --- PRIMARY SOURCES OF TRUTH (STRICT) ---
   1. FLIGHT ANCHOR: ${flightInfo}
   2. STAY ANCHOR: ${hotelInfo}
   -----------------------------------------
   RULE: If Anchers above are > 0, you MUST use them for 'estimate' values. Do NOT hallucinate your own numbers.

  Return valid JSON only:
  {
    "trip_summary": "Short overview...",
    "budget_breakdown": {
      "main_travel": { "label": "...", "estimate": 0, "note": "..." },
      "stay": { "label": "...", "estimate": 0, "note": "..." },
      "transport": { "label": "...", "estimate": 0, "note": "..." },
      "attractions": { "label": "...", "estimate": 0, "note": "..." },
      "food": { "label": "...", "estimate": 0, "note": "..." }
    },
    "daily_plans": [
      {
        "day": 1,
        "city": "City Name",
        "activities": [
          { "time": "Morning", "description": "...", "location": "Spot Name", "coordinates": { "lat": 0.0, "lng": 0.0 } },
          { "time": "Afternoon", "description": "...", "location": "Spot Name", "coordinates": { "lat": 0.0, "lng": 0.0 } },
          { "time": "Evening", "description": "...", "location": "Spot Name", "coordinates": { "lat": 0.0, "lng": 0.0 } }
        ]
      }
    ]
  }
  
  ### FINAL DONT'S (CRITICAL):
  - DO NOT group days like "Day 2-7". Each day must be its own separate object.
  - If days = 30, you MUST return exactly 30 objects in daily_plans.
  - EVERY day object must have a "city" property.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a professional travel planner. 
        CRITICAL: You must generate an itinerary for EXACTLY ${days} days. 
        If ${days} is 30, generate a full 30-day plan. 
        Do not stop early. Use realistic pricing.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    max_tokens: 6000,
  });

  const initialResponse = chatCompletion.choices[0]?.message?.content || "{}";

  // --- STAGE 2: SANITIZER & CARTOGRAPHER (using 70B) ---
  // We use the 70B model to clean up the 8B output, fix coordinates, and verify math.
  try {
    const sanitizerCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are the 'Sanitizer'. You take a draft travel JSON and: 
          1. MATH AUDIT: Verify every 'estimate' in budget_breakdown. 
             - FORMULA: Unit Price (USD) * Exchange Rate (${exchangeRate}) * Travelers (${travelers}) * Duration.
             - If any estimate looks like a math failure, FIX IT.
          2. FLIGHT REALISM: Ensure 'main_travel' covers ROUND-TRIP for ALL ${travelers} people. 
             - Domestic Round-Trip should be ~₹10,000 per person.
             - CRITICAL: If budget is 'Cheap' and destination is reachable by land (India domestic), REJECT Flights and change to 'Sleeper Class Train' (~₹1000 per person).
          3. ATTRACTION CHECK: If daily_plans mention paid sites (Museums, Forts, Statue of Unity), the 'attractions' budget MUST BE HIGHER THAN 0. 
             - Minimum for Cheap India: ₹200 * total_days * travelers.
          4. Ensure all coordinates (lat/lng) are accurate. 
          4. Clean up text objects into simple strings.
          5. NO GROUPING: Every day must be its own object.
          6. CITY VERIFICATION: Ensure every day has a "city" field.
          7. Return ONLY the polished JSON.`,
        },
        {
          role: "user",
          content: `Draft JSON: ${initialResponse}. Source: ${sourceCity}, Destination: ${destination}, Travelers: ${travelers}, Exchange Rate: ${exchangeRate}.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const sanitizedData = JSON.parse(sanitizerCompletion.choices[0]?.message?.content || initialResponse);

    // Merge or prioritize sanitized data
    let data = sanitizedData;

    // --- FINAL OVERRIDE (Only for REAL API Prices) ---
    if (realFlightPriceINR && data.budget_breakdown?.main_travel) {
      let multiplier = 1;
      if (budget.toLowerCase() === "luxury") multiplier = 2.5;
      data.budget_breakdown.main_travel.estimate = Math.round(realFlightPriceINR * multiplier);
      data.budget_breakdown.main_travel.label = multiplier > 1 ? "Business Class Flight" : "Economy Class Flight";
    }

    return data;
  } catch (err) {
    console.error("SANITIZER_FAILURE", err);
    return JSON.parse(initialResponse); // Fallback to raw 8B output if 70B fails
  }
}
