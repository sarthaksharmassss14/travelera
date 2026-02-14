import axios from "axios";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAmadeusToken() {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const response = await axios.post(
        "https://test.api.amadeus.com/v1/security/oauth2/token",
        new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.AMADEUS_CLIENT_ID!,
            client_secret: process.env.AMADEUS_CLIENT_SECRET!,
        }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    return cachedToken;
}

/**
 * Searches for the nearest airport code (IATA) for a given city name.
 */
export async function searchIataCode(cityName: string) {
    try {
        const token = await getAmadeusToken();
        const response = await axios.get(
            `https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(cityName)}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        // Find the first location that has an IATA code
        const location = response.data.data?.find((l: any) => l.iataCode);
        return location?.iataCode || null;
    } catch (error: any) {
        console.error("AMADEUS_CITY_SEARCH_ERROR", cityName, error.message);
        return null;
    }
}

/**
 * Fetches real flight offers between two IATA codes with travel class support.
 */
export async function getFlightPrices(originIata: string, destIata: string, date: string, returnDate?: string, travelClass: string = "ECONOMY") {
    try {
        const token = await getAmadeusToken();
        const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originIata}&destinationLocationCode=${destIata}&departureDate=${date}${returnDate ? `&returnDate=${returnDate}` : ''}&adults=1&nonStop=false&max=5&currencyCode=USD&travelClass=${travelClass}`;

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return response.data.data || [];
    } catch (error: any) {
        console.error("AMADEUS_FLIGHT_ERROR", error.response?.data || error.message);
        return [];
    }
}

/**
 * Fetches hotel pricing benchmarks for a given city with star rating filtering.
 */
export async function getHotelPrices(cityCode: string, checkInDate: string, adults: number = 1, ratings: string = "3") {
    try {
        const token = await getAmadeusToken();

        // Step 1: Find hotels in city with specific ratings
        const hotelListUrl = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=5&radiusUnit=KM&hotelSource=ALL&ratings=${ratings}`;
        const listResponse = await axios.get(hotelListUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const hotelIds = listResponse.data.data?.slice(0, 3).map((h: any) => h.hotelId);
        if (!hotelIds || hotelIds.length === 0) return [];

        // Step 2: Get offers for these specific hotels
        const offersUrl = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds.join(",")}&adults=${adults}&checkInDate=${checkInDate}&roomQuantity=1&bestRateOnly=true`;
        const offersResponse = await axios.get(offersUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return offersResponse.data.data || [];
    } catch (error: any) {
        console.error("AMADEUS_HOTEL_ERROR", error.response?.data || error.message);
        return [];
    }
}
