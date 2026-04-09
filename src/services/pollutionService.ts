export interface PollutionData {
    aqi: number;
    pm2_5: number;
    no2: number;
    o3: number;
}

export const getPollutionData = async (lat: number, lon: number): Promise<PollutionData | null> => {
    try {
        // Python backend proxy — uses WAQI (real sensor data) with Open-Meteo fallback.
        // API key stays server-side; browser never sees WAQI_TOKEN.
        const res = await fetch(`/api/pollution?lat=${lat}&lon=${lon}`);
        if (!res.ok) return null;
        const d = await res.json();
        return {
            aqi:   d.aqi   ?? 50,
            pm2_5: d.pm25  ?? 15,
            no2:   d.no2   ?? 10,
            o3:    d.o3    ?? 20,
        };
    } catch (error) {
        console.warn('Error fetching pollution data:', error);
        return null;
    }
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

    if (count === 0) return { aqi: 50, pm2_5: 15, no2: 10, o3: 20 }; // Fallback defaults

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

