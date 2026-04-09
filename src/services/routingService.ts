/**
 * routingService.ts
 *
 * All routing is handled by the Python backend (/api/routes).
 * TomTom API key lives server-side — never in the browser bundle.
 * The Python layer runs Dijkstra (Unit III) and Greedy (Unit II) on the
 * real TomTom routes and returns 3 colour-coded RouteData objects.
 */
import { RouteData } from '@/data/routeData';
import { buildFallbackRoutes } from '@/services/fallbackRouting';

type TravelMode = 'pedestrian' | 'cyclist';

const getFallbackRoutes = (
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    mode: TravelMode
) => {
    console.warn('Using fallback routes because the routing API is unavailable.');
    return buildFallbackRoutes(start, end, mode);
};

export const getRoutes = async (
    start: { lat: number; lon: number },
    end:   { lat: number; lon: number },
    mode:  TravelMode = 'pedestrian'
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
            return getFallbackRoutes(start, end, mode);
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            console.error('Routing API returned a non-JSON payload.');
            return getFallbackRoutes(start, end, mode);
        }

        const routes = await res.json() as RouteData[];
        return Array.isArray(routes) && routes.length > 0
            ? routes
            : getFallbackRoutes(start, end, mode);
    } catch (error) {
        console.error('Routing API failed:', error);
        return getFallbackRoutes(start, end, mode);
    }
};
