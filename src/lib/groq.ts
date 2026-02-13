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

export async function generateItinerary(
  destination: string,
  days: number,
  budget: string,
  sourceCity: string,
  researchContext: string,
  realFlightPriceINR?: number,
  travelers: number = 1,
  exchangeRate: number = 90
) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from .env.local");
  }

  const flightInfo = realFlightPriceINR
    ? `Live dynamic flight price for this route for ${travelers} traveler(s) is approx ₹${realFlightPriceINR}.`
    : `Estimate based on typical 2026 rates for ${travelers} traveler(s).`;

  const prompt = `You are a professional travel planner. Plan a trip from ${sourceCity} to ${destination} for ${days} days for ${travelers} travelers.
  Budget: ${budget}.
  
  ### EXCHANGE RATE: 1 USD = ${exchangeRate.toFixed(2)} INR.
  
  ### FINANCIAL REALITY CHECK (CRITICAL):
  - SANITY LIMITS (Total for ALL ${travelers} people):
    - NO ENTRY or FOOD for a "Cheap" trip should ever exceed ₹1 Lakh. 
    - If you are calculating in USD, convert using the live rate of ₹${exchangeRate.toFixed(2)}. 
    - Example: A $100 expense is ₹${(100 * exchangeRate).toFixed(0)}.
    - A $450 expense is ₹${(450 * exchangeRate).toFixed(0)}. NOT ₹9,00,000.
    - If your total trip budget is over ₹20 Lakhs for a "Cheap/Mid" trip, YOUR MATH IS WRONG.

  ### TRANSPORT RULES:
  1. Overseas (Oceanic): ONLY FLIGHTS allowed. No buses/trains.
     - Near Asia/UAE (Thailand, Dubai, etc.): Flights usually ₹15k-₹22k per person.
     - Long Haul (Europe, Australia, Americas): Flights usually ₹50k-₹75k per person.
  2. Domestic/Land-connected: Bus/Train (Cheap), Flight (Mid/Luxury).

  ### DATA RULES:
  - ALL PRICING MUST BE TOTAL FOR ${travelers} PEOPLE.
  - "main_travel": Total round-trip cost for ${travelers} people.
  ### ITINERARY RULES:
  - 3 activities/day: Morning, Afternoon, Evening. 
  - Descriptions: Informative but concise (15-20 words).
  - Use specific POI names for "location".

  Research: ${researchContext.substring(0, 1000)}
  Flight: ${flightInfo}

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
        "activities": [
          { "time": "Morning", "description": "...", "location": "Spot Name", "coordinates": { "lat": 0.0, "lng": 0.0 } },
          { "time": "Afternoon", "description": "...", "location": "Spot Name", "coordinates": { "lat": 0.0, "lng": 0.0 } },
          { "time": "Evening", "description": "...", "location": "Spot Name", "coordinates": { "lat": 0.0, "lng": 0.0 } }
        ]
      }
    ]
  }`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a professional travel planner. Respond ONLY with valid JSON. Use realistic pricing for flights (₹15k-25k for SE Asia, ₹50k+ for Long Haul).",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.1-8b-instant",
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const initialResponse = chatCompletion.choices[0]?.message?.content || "{}";

  // --- STAGE 2: SANITIZER & CARTOGRAPHER (using 70B) ---
  // We use the 70B model to clean up the 8B output, fix coordinates, and verify math.
  try {
    const sanitizerCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are the 'Sanitizer'. You take a draft travel JSON and: 1. Ensure all budget math is correct. 2. Verify and fix all coordinates (lat/lng) for accuracy. 3. Clean up any weird text objects into simple strings. 4. Return ONLY the polished JSON.",
        },
        {
          role: "user",
          content: `Draft JSON: ${initialResponse}. Travelers: ${travelers}. Live Exchange Rate: ${exchangeRate}.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const sanitizedData = JSON.parse(sanitizerCompletion.choices[0]?.message?.content || initialResponse);

    // Merge or prioritize sanitized data
    let data = sanitizedData;

    // --- REFINED POST-PROCESSING ---
    const destLower = destination.toLowerCase();
    const isNearInternational = destLower.match(/thailand|bangkok|dubai|uae|singapore|vietnam|bali|malaysia|nepal|bhutan|sri lanka/);
    const isLongHaul = destLower.match(/australia|usa|america|europe|argentina|brazil|japan|uk|canada|africa/);
    const currentLabel = data.budget_breakdown?.main_travel?.label?.toLowerCase() || "";

    if ((isNearInternational || isLongHaul) && (currentLabel.includes("bus") || currentLabel.includes("train"))) {
      data.budget_breakdown.main_travel.label = "Round-trip International Flight";
      if (!realFlightPriceINR) {
        data.budget_breakdown.main_travel.estimate = (isNearInternational ? 20000 : 70000) * travelers;
      }
    }

    if (realFlightPriceINR) {
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
