export interface GeocodeResult {
    lat: number;
    lon: number;
    display_name: string;
}

/**
 * Nominatim OpenStreetMap geocoding — free, no API key, global coverage.
 * Same data source as many map applications. Requires a User-Agent header
 * per OSM usage policy.
 */
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = {
    'Accept-Language': 'en',
    'User-Agent': 'BreatheWay-DAA-App/1.0 (daakrish.vercel.app)',
};

/** Format a Nominatim result into a short, readable label */
function formatDisplayName(result: any): string {
    const addr = result.address ?? {};
    const parts: string[] = [];

    // Name / POI
    const name = result.name || addr.amenity || addr.building || addr.tourism;
    if (name) parts.push(name);

    // Road / neighbourhood
    if (addr.road) parts.push(addr.road);
    else if (addr.neighbourhood) parts.push(addr.neighbourhood);
    else if (addr.suburb) parts.push(addr.suburb);

    // City
    const city = addr.city || addr.town || addr.village || addr.county;
    if (city) parts.push(city);

    // State + country
    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);

    return parts.length > 0 ? parts.join(', ') : result.display_name;
}

export const getSuggestions = async (query: string): Promise<GeocodeResult[]> => {
    try {
        const url =
            `${NOMINATIM}/search` +
            `?q=${encodeURIComponent(query)}` +
            `&format=json&limit=6&addressdetails=1&extratags=0`;

        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);

        const data: any[] = await response.json();
        if (!Array.isArray(data) || data.length === 0) return [];

        return data.map(r => ({
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
            display_name: formatDisplayName(r),
        }));
    } catch (error) {
        console.error('Error getting suggestions:', error);
        return [];
    }
};

export const searchLocation = async (query: string): Promise<GeocodeResult | null> => {
    try {
        const results = await getSuggestions(query);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Error searching location:', error);
        return null;
    }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
    try {
        const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) throw new Error('Reverse geocoding failed');

        const data = await response.json();
        return formatDisplayName(data) ?? null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};
