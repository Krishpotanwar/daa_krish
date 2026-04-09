export interface GeocodeResult {
    lat: number;
    lon: number;
    display_name: string;
}

/**
 * Nominatim OpenStreetMap geocoding — completely free, no API key needed.
 * Works for any location worldwide.
 */
const NOMINATIM = 'https://nominatim.openstreetmap.org';

export const searchLocation = async (query: string): Promise<GeocodeResult | null> => {
    try {
        const results = await getSuggestions(query);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Error searching location:', error);
        return null;
    }
};

export const getSuggestions = async (query: string): Promise<GeocodeResult[]> => {
    try {
        const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
        const response = await fetch(url, {
            headers: { 'Accept-Language': 'en' }
        });

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) return [];

        return data.map((result: any) => ({
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            display_name: result.display_name,
        }));
    } catch (error) {
        console.error('Error getting suggestions:', error);
        return [];
    }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
    try {
        const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json`;
        const response = await fetch(url, {
            headers: { 'Accept-Language': 'en' }
        });

        if (!response.ok) throw new Error('Reverse geocoding failed');

        const data = await response.json();
        return data.display_name ?? null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};
