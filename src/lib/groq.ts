import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateItinerary(
  destination: string,
  days: number,
  budget: string,
  sourceCity: string,
  researchContext: string,
  realFlightPriceINR?: number
) {
  const flightInfo = realFlightPriceINR
    ? `Live dynamic flight price for this route is approx ₹${realFlightPriceINR}.`
    : `No live flight price found. Please estimate based on typical 2026 rates.`;

  const prompt = `You are a professional AI Travel Planner. Plan a trip from ${sourceCity} to ${destination} for ${days} days.
  Travel Style Preference: ${budget}.
  
  SMART LOGIC & TRANSPORT TIERS (STRICT):
  1. DESTINATION SCALE DETECTION (CRITICAL):
     - IF destination is a COUNTRY (e.g. Japan, France) or STATE (e.g. Rajasthan, Kerala):
       * You MUST create a MULTI-CITY CIRCUIT. Do NOT stay in one city.
       * Example for "Rajasthan" (7 days): Jaipur (2) -> Jodhpur (2) -> Udaipur (3).
       * Distribute the days logically across top 2-3 cities.
     - IF destination is a CITY (e.g. Paris, Tokyo):
       * Spend all days exploring that city deeply.

  2. GEOGRAPHY & TRANSPORT RULES (CRITICAL):
     - CHECK CROSS-CONTINENT: Is ${sourceCity} to ${destination} possible by road?
     - IF NO (e.g. India to Argentina, Europe, USA, Japan):
       * You MUST use FLIGHTS for "main_travel", even for "Cheap" budget.
       * Bus/Train is IMPOSSIBLE. Do NOT suggest "Sleeper Bus to Buenos Aires".
       * Minimum Flight Cost for Inter-Continental: ₹40,000+.
     - IF YES (e.g. Delhi to Nepal, Bhutan, or Domestic):
       * You may use Bus/Train for "Cheap".

  3. DESTINATION FOCUS: All activities MUST be for the target destination/circuit. The source ${sourceCity} is only for initial transport.
  4. FINANCIAL REALITY CHECK (MANDATORY):
     - CURRENCY ALERT: 1 USD ≈ ₹87 INR. 1 Euro ≈ ₹92. 
     - SANITY LIMITS (Per Person, Per Night):
       * Hostel/Dorm: Max ₹3,000 - ₹5,000 (Global Average). NEVER ₹50,000+.
       * 3-Star Hotel: Max ₹8,000 - ₹15,000.
       * Local Transport (Metro/Taxi): Max ₹2,000 - ₹5,000 per day.
     - IF your calculation exceeds these, YOU ARE CONFUSING CURRENCIES. RE-CALCULATE using INR.

  5. STRICT CATEGORY BUDGETING (PER PERSON):
     Based on "${budget}" selection, you MUST adhere to these daily limits:
     
     A. CHEAP (Backpacker/Budget):
        - Stay (Hostel/Homestay/Dorm): ₹100 - ₹1,100 per night. (NEVER > ₹2000).
        - Food (Street Food/Thalis): ₹500 per day. (NEVER > ₹1500).
        - Local Transport: Shared Auto/Bus/Metro only.
     
     B. MID (Comfort/Family):
        - Stay (3-Star Hotel): ₹1,200 - ₹5,000 per night.
        - Food (Restaurants): ₹600 - ₹1,000 per day.
        - Local Transport: Cab/Auto.

     C. LUXURY (Premium):
        - Stay (5-Star/Resort): ₹8,000 - ₹25,000+ per night.
        - Food (Fine Dining): ₹1,000+ per day.
        - Local Transport: Pvt Taxi/Chauffeur.

  6. MATH & CALCULATION RULES (ABSOLUTE):
     - STAY COST = (Price Per Night) × (Number of Nights).
       * Example: ₹800/night × 5 nights = ₹4,000.
       * ERROR: Do NOT output ₹40,000 just because you feel like it.
     - FOOD COST = (Daily Budget) × (Number of Days).
     - TOTAL = Sum of all category costs.
     - DO NOT use "Package Deals" or "Flight + Hotel" combined prices. Break them down.

  7. TRANSPORT & STAY LOGIC:
     
     CASE A: IF ${sourceCity} to ${destination} is DOMESTIC or LAND-CONNECTED:
     - Cheap: Use Sleeper Class Train or Bus. Stay: Hostel/Guesthouse/Homestay.
     - Mid: Use 3AC Train or AC Bus/Flight (if affordable). Stay: 3-Star Hotel.
     - Luxury: Use Business Class Flight or 1st AC Train. Stay: 5-Star Hotel/Resort.

     CASE B: IF ${sourceCity} to ${destination} is OVERSEAS/INTERNATIONAL (Cross-Border):
     - Cheap: ECONOMY Flight (LCC like Indigo/AirAsia). Stay: Hostel/Dorm.
     - Mid: ECONOMY Flight (Full Service/Standard). Stay: 3-Star Hotel.
     - Luxury: BUSINESS CLASS Flight. Stay: 5-Star Resort/Hotel.

  3. COST CALCULATION & SMART GUARDRAILS (CRITICAL 2026 RATES): 
     - "main_travel": Total ROUND-TRIP (To & Fro) for ALL travelers.
     - "stay": (Price per Night * ${days - 1} Nights). Use market-accurate rates for the location.
     - "food": (Price per Day * ${days} Days).
       * MIN FLOOR: ₹300/day (Cheap), ₹800/day (Mid), ₹1500/day (Luxury).
     - "transport": (Intracity/Local travel per day * ${days}).
       * MIN FLOOR: ₹300/day (Cheap), ₹1000/day (Mid), ₹4000/day (Luxury).
     - "attractions": Total for all major sights/tickets. NEVER use values like ₹1 or ₹0. Minimum total should be ₹500.
     - All figures MUST be in Indian Rupees (INR).
     - Live Flight Reference: ${flightInfo}.
     - REAL-WORLD GROUND TRUTH (Research Findings): 
       ${researchContext}

  CRITICAL INSTRUCTION: 
  You MUST use the pricing found in "REAL-WORLD GROUND TRUTH" above. 
  - If research says "Sleeper Bus is ₹800", your main_travel estimate MUST be approx ₹1600 (Round Trip). 
  - If research says "Hostel is ₹500", your stay estimate MUST use ₹500/night.
  - TRANSPORT CONNECTIVITY: If the destination (e.g., Shillong/Gangtok/kasol) has NO direct Train/Flight:
     - You MUST plan for "Train to Nearest Major Station (e.g., Guwahati/Chandigarh) + Shared Cab/Bus".
     - The "main_travel" cost MUST include BOTH legs of the journey.
     - Label it clearly: "Train to Guwahati + Shared Sumos to Shillong".
  - DO NOT IGNORE the research data.

  4. LABELS & NOTES: 
     - Use FULL sentences and descriptive labels. DO NOT truncate. 
     - Correct: "Round-trip Flight (DEL-BOM) via IndiGo".
     - Correct: "4 Nights stay at Zostel Mumbai (Dorm Bed)".

  Return ONLY a valid JSON object:
  {
    "trip_summary": "overview...",
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
        "activities": [
          { "time": "Morning", "description": "Travel from ${sourceCity} to ${destination}", "location": "Departure Point" },
          { "time": "Afternoon", "description": "Check-in and lunch at ${destination}", "location": "${destination}" },
          { "time": "Evening", "description": "Exploring local area in ${destination}", "location": "${destination}" }
        ]
      }
    ]
  }`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a world-class travel planner. You always respond in strict JSON format. You use smart geographic logic to decide transport modes.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.1-8b-instant",
    response_format: { type: "json_object" },
  });

  const content = chatCompletion.choices[0]?.message?.content || "{}";
  const data = JSON.parse(content);

  // If the AI chose a flight and we have a real price, ensure it's used
  if (realFlightPriceINR && data.budget_breakdown?.main_travel?.label.toLowerCase().includes("flight")) {
    // For luxury, we might want to scale the economy price found in the test API
    const multiplier = budget.toLowerCase() === "luxury" ? 3 : 1;
    data.budget_breakdown.main_travel.estimate = realFlightPriceINR * multiplier;
    data.budget_breakdown.main_travel.note = `Based on dynamic market rates for 2026.`;
  }

  return data;
}
