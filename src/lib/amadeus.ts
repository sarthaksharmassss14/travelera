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
 * Fetches real flight offers between two IATA codes.
 */
export async function getFlightPrices(originIata: string, destIata: string, date: string, returnDate?: string) {
    try {
        const token = await getAmadeusToken();
        const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originIata}&destinationLocationCode=${destIata}&departureDate=${date}${returnDate ? `&returnDate=${returnDate}` : ''}&adults=1&nonStop=false&max=5&currencyCode=USD`;

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return response.data.data || [];
    } catch (error: any) {
        console.error("AMADEUS_FLIGHT_ERROR", error.response?.data || error.message);
        return [];
    }
}
