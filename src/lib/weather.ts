import axios from "axios";

export async function getWeatherData(destination: string) {
    try {
        // 1. Geocode Destination
        const geoRes = await axios.get(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                destination
            )}&count=1&language=en&format=json`
        );

        if (!geoRes.data.results || geoRes.data.results.length === 0) {
            throw new Error("Destination not found");
        }

        const { latitude, longitude, country } = geoRes.data.results[0];

        // 2. Get Weather Forecast
        const weatherRes = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
        );

        return {
            location: destination,
            country,
            coordinates: { latitude, longitude },
            forecast: weatherRes.data.daily,
        };
    } catch (error: any) {
        console.error("WEATHER_ERROR", error);
        throw error;
    }
}
