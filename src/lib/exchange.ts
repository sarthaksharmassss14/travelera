import axios from "axios";

let cachedRate: number | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours

export async function getExchangeRate(): Promise<number> {
    const now = Date.now();

    if (cachedRate && (now - lastFetch < CACHE_DURATION)) {
        return cachedRate;
    }

    try {
        const response = await axios.get("https://open.er-api.com/v6/latest/USD");
        const rate = response.data.rates.INR;
        if (rate) {
            cachedRate = rate;
            lastFetch = now;
            return rate;
        }
    } catch (error) {
        console.error("EXCHANGE_RATE_FETCH_ERROR", error);
    }

    // Fallback if API fails
    return cachedRate || 90;
}
