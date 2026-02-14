import { NextResponse } from "next/server";
import { generateItinerary, resolveGateway, parseUserQuery } from "@/lib/groq";
import { searchIataCode, getFlightPrices, getHotelPrices } from "@/lib/amadeus";

import { researchTravelCosts } from "@/lib/researcher";
import { getExchangeRate } from "@/lib/exchange";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { destination, days, budget, sourceCity, travelers = 1, query } = body;

        // If a natural language query is provided, parse it first
        if (query) {
            const parsed = await parseUserQuery(query);
            destination = parsed.destination;
            days = parsed.days;
            budget = parsed.budget;
            sourceCity = parsed.sourceCity;
            travelers = parsed.travelers;
            body.vibe = parsed.vibe;
        }

        const liveExchangeRate = await getExchangeRate();

        if (!destination || !days || !budget || !sourceCity) {
            return NextResponse.json({ error: "Missing required fields. If you are confused, try providing a detailed query." }, { status: 400 });
        }

        // 1. Resolve Hub Cities, Fetch REAL dynamic flight & hotel price AND Research Data in Parallel
        let flightEstimateINR = 0;
        let hotelEstimateINR = 0;
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

            // Fetch Data in Parallel
            const date = new Date();
            date.setMonth(date.getMonth() + 1);
            const checkInStr = date.toISOString().split('T')[0];

            // Map budget to star ratings and flight class
            let ratingString = "3"; // Default for Mid
            let travelClass = "ECONOMY";

            if (budget.toLowerCase() === "cheap") {
                ratingString = "1,2";
                travelClass = "ECONOMY";
            } else if (budget.toLowerCase() === "luxury") {
                ratingString = "4,5";
                travelClass = "BUSINESS";
            }

            const flightsPromise = srcIata && destIata ? getFlightPrices(srcIata, destIata, checkInStr, undefined, travelClass) : Promise.resolve([]);
            const hotelsPromise = destIata ? getHotelPrices(destIata, checkInStr, travelers, ratingString) : Promise.resolve([]);

            const [flights, hotels] = await Promise.all([flightsPromise, hotelsPromise]);

            // Process Flight Results
            if (flights && flights.length > 0) {
                const avgUSD = parseFloat(flights[0].price.total);
                flightEstimateINR = Math.round(avgUSD * liveExchangeRate * travelers);
            }

            // Process Hotel Results
            if (hotels && hotels.length > 0) {
                // Find a representative price (taking the first offer for simplicity)
                const offer = hotels[0].offers?.[0];
                if (offer) {
                    const pricePerNightUSD = parseFloat(offer.price?.total || "0");
                    hotelEstimateINR = Math.round(pricePerNightUSD * liveExchangeRate * days); // Total for the whole stay
                }
            }
        } catch (err) {
            console.error("DATA_FETCH_ERROR", err);
        }

        // 2. Generate the rest using AI, passing estimates, research context, and live exchange rate
        const itinerary = await generateItinerary(destination, days, budget, sourceCity, researchContext, flightEstimateINR, travelers, liveExchangeRate, body.vibe, hotelEstimateINR);

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
