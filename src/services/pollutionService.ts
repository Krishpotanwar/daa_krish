export interface PollutionData {
    aqi: number;
    pm2_5: number;
    no2: number;
    o3: number;
}

interface PollutionApiPayload {
    aqi?: number;
    pm25?: number;
    pm2_5?: number;
    no2?: number;
    o3?: number;
    current?: {
        us_aqi?: number;
        pm2_5?: number;
        nitrogen_dioxide?: number;
        ozone?: number;
    };
}

const DEFAULT_POLLUTION: PollutionData = {
    aqi: 50,
    pm2_5: 15,
    no2: 10,
    o3: 20,
};

const toPollutionData = (payload: PollutionApiPayload): PollutionData => ({
    aqi: payload?.aqi ?? payload?.current?.us_aqi ?? DEFAULT_POLLUTION.aqi,
    pm2_5: payload?.pm25 ?? payload?.pm2_5 ?? payload?.current?.pm2_5 ?? DEFAULT_POLLUTION.pm2_5,
    no2: payload?.no2 ?? payload?.current?.nitrogen_dioxide ?? DEFAULT_POLLUTION.no2,
    o3: payload?.o3 ?? payload?.current?.ozone ?? DEFAULT_POLLUTION.o3,
});

const fetchJson = async (url: string): Promise<PollutionApiPayload | null> => {
    try {
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
            return null;
        }
        return await res.json() as PollutionApiPayload;
    } catch (error) {
        console.warn('Pollution request failed:', error);
        return null;
    }
};

export const getPollutionData = async (lat: number, lon: number): Promise<PollutionData | null> => {
    const proxiedPayload = await fetchJson(`/api/pollution?lat=${lat}&lon=${lon}`);
    if (proxiedPayload) {
        return toPollutionData(proxiedPayload);
    }

    const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        current: 'us_aqi,pm2_5,nitrogen_dioxide,ozone',
        timezone: 'auto',
    });

    const directPayload = await fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`);
    return directPayload ? toPollutionData(directPayload) : DEFAULT_POLLUTION;
};

// Helper to batch fetch or average pollution for a route
// For simplicity, we might just sample the midpoint or a few points
export const getRoutePollutionScore = async (points: [number, number][]): Promise<PollutionData> => {
    // Strategy: Take the start, middle, and end points to get an average representation
    if (points.length === 0) return { aqi: 0, pm2_5: 0, no2: 0, o3: 0 };

    // Sample start, mid, end of the route.
    // Open-Meteo works for any location globally — no snapping needed.
    const samplePoints = [
        points[0],
        points[Math.floor(points.length / 2)],
        points[points.length - 1]
    ];

    let totalAqi = 0;
    let totalPm25 = 0;
    let totalNo2 = 0;
    let count = 0;

    for (const point of samplePoints) {
        const data = await getPollutionData(point[0], point[1]);
        if (data) {
            totalAqi += data.aqi;
            totalPm25 += data.pm2_5;
            totalNo2 += data.no2;
            count++;
        }
    }

    if (count === 0) return DEFAULT_POLLUTION;

    return {
        aqi: Math.round(totalAqi / count),
        pm2_5: Math.round(totalPm25 / count),
        no2: Math.round(totalNo2 / count), // Use actual NO2 average
        o3: 0
    };
};

// Generate dynamic pollution zones around a center point using real data sampling
export const generatePollutionZones = async (center: { lat: number, lon: number }, count: number = 5) => {
    const zones: { center: [number, number], radius: number, level: 'low' | 'moderate' | 'high' }[] = [];

    // Strategy: Sample points in a grid/circle around the center to find actual hotspots
    const radiusInDegrees = 0.03; // Approx 3km

    await Promise.all(Array.from({ length: count }).map(async (_, i) => {
        // Create points in a circle around the center
        const angle = (i / count) * 2 * Math.PI;
        const lat = center.lat + (Math.random() * radiusInDegrees) * Math.cos(angle);
        const lon = center.lon + (Math.random() * radiusInDegrees) * Math.sin(angle);

        const data = await getPollutionData(lat, lon);
        if (data) {
            let level: 'low' | 'moderate' | 'high' = 'moderate';
            if (data.aqi > 150) level = 'high';
            else if (data.aqi < 50) level = 'low';

            zones.push({
                center: [lat, lon],
                radius: 100 + Math.random() * 200, // Larger visual zones
                level
            });
        }
    }));

    return zones;
};
