export interface PollutionData {
    aqi: number;
    pm2_5: number;
    no2: number;
    o3: number;
}

export const getPollutionData = async (lat: number, lon: number): Promise<PollutionData | null> => {
    try {
        // Open-Meteo Air Quality API
        // Fetching current conditions (using hourly[0] as an approximation for "now" or closest hour)
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,nitrogen_dioxide,ozone&timezone=auto`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Pollution data fetch failed');

        const data = await response.json();

        if (!data.current) return null;

        return {
            aqi: data.current.us_aqi || 0,
            pm2_5: data.current.pm2_5 || 0,
            no2: data.current.nitrogen_dioxide || 0,
            o3: data.current.ozone || 0
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

