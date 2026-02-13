import { NextResponse } from "next/server";
import { generateItinerary, resolveGateway } from "@/lib/groq";
import { searchIataCode, getFlightPrices } from "@/lib/amadeus";

import { researchTravelCosts } from "@/lib/researcher";
import { getExchangeRate } from "@/lib/exchange";

export async function POST(req: Request) {
    try {
        const { destination, days, budget, sourceCity, travelers = 1 } = await req.json();
        const liveExchangeRate = await getExchangeRate();

        if (!destination || !days || !budget || !sourceCity) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Resolve Hub Cities, Fetch REAL dynamic flight price AND Research Data in Parallel
        let flightEstimateINR = 0;
        let researchContext = "";

        try {
            // Step 1a: Convert broad locations (like Japan/Kerala) into Hub Cities (Tokyo/Jaipur)
            const resolvedSourcePromise = resolveGateway(sourceCity);
            const resolvedDestPromise = resolveGateway(destination);

            const [resolvedSource, resolvedDest] = await Promise.all([resolvedSourcePromise, resolvedDestPromise]);

            // Step 1b: Search IATA codes and research costs
            const srcIataPromise = searchIataCode(resolvedSource);
            const destIataPromise = searchIataCode(resolvedDest);
            const researchPromise = researchTravelCosts(sourceCity, destination, budget);

            const [srcIata, destIata, researchData] = await Promise.all([srcIataPromise, destIataPromise, researchPromise]);

            researchContext = researchData;

            if (srcIata && destIata) {
                // Use a date roughly 1 month from now for a benchmark "dynamic" price
                const futureDate = new Date();
                futureDate.setMonth(futureDate.getMonth() + 1);
                const departureDateStr = futureDate.toISOString().split('T')[0];

                // Calculate return date based on 'days'
                const returnDate = new Date(futureDate);
                returnDate.setDate(returnDate.getDate() + days);
                const returnDateStr = returnDate.toISOString().split('T')[0];

                const flights = await getFlightPrices(srcIata, destIata, departureDateStr, returnDateStr);
                if (flights.length > 0) {
                    // Take the first offer (cheapest)
                    const avgUSD = parseFloat(flights[0].price.total);
                    flightEstimateINR = Math.round(avgUSD * liveExchangeRate * travelers);
                }
            }
        } catch (err) {
            console.error("DATA_FETCH_ERROR", err);
            // Fallback to AI estimate if API fails
        }

        // 2. Generate the rest using AI, passing the flight estimate, research context, and live exchange rate
        const itinerary = await generateItinerary(destination, days, budget, sourceCity, researchContext, flightEstimateINR, travelers, liveExchangeRate);

        // Add the sourceCity and destination to the final object for persistence
        const finalData = { ...itinerary, destination, sourceCity, travelers };

        return NextResponse.json(finalData);
    } catch (error: any) {
        console.error("GENERATE_ERROR_FULL:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
