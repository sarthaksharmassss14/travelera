import { NextResponse } from "next/server";
import { generateItinerary } from "@/lib/groq";
import { searchIataCode, getFlightPrices } from "@/lib/amadeus";

import { researchTravelCosts } from "@/lib/researcher";

const USD_TO_INR = 84;

export async function POST(req: Request) {
    try {
        const { destination, days, budget, sourceCity } = await req.json();

        if (!destination || !days || !budget || !sourceCity) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch REAL dynamic flight price AND Research Data in Parallel
        let flightEstimateINR = 0;
        let researchContext = "";

        try {
            const srcIataPromise = searchIataCode(sourceCity);
            const destIataPromise = searchIataCode(destination);
            const researchPromise = researchTravelCosts(sourceCity, destination, budget);

            const [srcIata, destIata, researchData] = await Promise.all([srcIataPromise, destIataPromise, researchPromise]);

            researchContext = researchData;

            if (srcIata && destIata) {
                // Use a date roughly 1 month from now for a benchmark "dynamic" price
                const futureDate = new Date();
                futureDate.setMonth(futureDate.getMonth() + 1);
                const dateStr = futureDate.toISOString().split('T')[0];

                const flights = await getFlightPrices(srcIata, destIata, dateStr);
                if (flights.length > 0) {
                    // Take the average of top 3 offers or the cheapest one
                    const avgUSD = parseFloat(flights[0].price.total);
                    flightEstimateINR = Math.round(avgUSD * USD_TO_INR);
                }
            }
        } catch (err) {
            console.error("DATA_FETCH_ERROR", err);
            // Fallback to AI estimate if API fails
        }

        // 2. Generate the rest using AI, passing the flight estimate and research context
        const itinerary = await generateItinerary(destination, days, budget, sourceCity, researchContext, flightEstimateINR);

        // Add the sourceCity and destination to the final object for persistence
        const finalData = { ...itinerary, destination, sourceCity };

        return NextResponse.json(finalData);
    } catch (error: any) {
        console.error("GENERATE_ERROR", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
