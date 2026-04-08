export interface GeocodeResult {
    lat: number;
    lon: number;
    display_name: string;
}

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

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
        if (!TOMTOM_API_KEY) {
            throw new Error('TomTom API Key is missing');
        }

        const response = await fetch(
            `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}&limit=5&idxSet=POI,Str,Geo&typeahead=true`
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results.map((result: any) => ({
                lat: result.position.lat,
                lon: result.position.lon,
                display_name: result.poi && result.poi.name
                    ? `${result.poi.name}, ${result.address.freeformAddress}`
                    : result.address.freeformAddress
            }));
        }

        return [];
    } catch (error) {
        console.error('Error getting suggestions:', error);
        return [];
    }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
    try {
        if (!TOMTOM_API_KEY) {
            throw new Error('TomTom API Key is missing');
        }

        const response = await fetch(
            `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }

        const data = await response.json();

        if (data.addresses && data.addresses.length > 0) {
            return data.addresses[0].address.freeformAddress;
        }

        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};

