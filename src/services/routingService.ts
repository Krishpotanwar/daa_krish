/**
 * routingService.ts
 *
 * All routing is handled by the Python backend (/api/routes).
 * TomTom API key lives server-side — never in the browser bundle.
 * The Python layer runs Dijkstra (Unit III) and Greedy (Unit II) on the
 * real TomTom routes and returns 3 colour-coded RouteData objects.
 */
import { RouteData } from '@/data/routeData';

export const getRoutes = async (
    start: { lat: number; lon: number },
    end:   { lat: number; lon: number },
    mode:  'pedestrian' | 'cyclist' = 'pedestrian'
): Promise<RouteData[]> => {
    try {
        const res = await fetch('/api/routes', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ start, end, mode }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('Routing API error:', res.status, err);
            return [];
        }

        return await res.json() as RouteData[];
    } catch (error) {
        console.error('Routing API failed:', error);
        return [];
    }
};
