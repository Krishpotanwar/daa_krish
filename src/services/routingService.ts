import { LatLngExpression } from 'leaflet';
import { RouteData } from '@/data/routeData';
import { getRoutePollutionScore } from './pollutionService';
import { lungHealthScoringService } from './lungHealthScoringService';
import { dijkstra, DELHI_GRAPH, reconstructPath } from '@/algorithms/shortestPath';

interface OSRMResponse {
    routes: {
        geometry: string; // Polyline encoded string
        duration: number; // seconds
        distance: number; // meters
    }[];
}

// Simple polyline decoder (since OSRM returns encoded polylines)
// Adapted from Mapbox implementation
function decodePolyline(str: string, precision: number = 5): LatLngExpression[] {
    let index = 0,
        lat = 0,
        lng = 0,
        coordinates: LatLngExpression[] = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    while (index < str.length) {
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
}

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

/**
 * Maps grid coordinates [x, y] back to LatLng using linear interpolation
 */
const mapGridToCoords = (
    path: [number, number][],
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    gridSize: number
): LatLngExpression[] => {
    return path.map(([x, y]) => {
        const lat = start.lat + (x / gridSize) * (end.lat - start.lat);
        const lon = start.lon + (y / gridSize) * (end.lon - start.lon);
        return [lat, lon] as [number, number];
    });
};

/**
 * Example function to call the custom Python pathfinding API
 * This can be used to integrate BFS/DFS logic into the frontend.
 */
export const getPythonRoutes = async (
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    gridSize: number = 20
): Promise<RouteData[]> => {
    try {
        const response = await fetch('http://localhost:8001/find-path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start: [0, 0], // In this demo, start is always [0,0] grid
                end: [gridSize - 1, gridSize - 1], // End is diagonal
                grid_size: gridSize
            })
        });

        if (!response.ok) throw new Error('Python API call failed');
        const data = await response.json();

        const routes: RouteData[] = [];

        // 1. A* (The modern standard for optimal paths)
        if (data.a_star_path) {
            routes.push({
                id: `a_star-${Date.now()}`,
                name: 'Optimal Health Path',
                algorithm: 'A* Search',
                duration: '14 min',
                distance: '1.4 km',
                pollutionScore: 35,
                inhaledDose: 75,
                color: '#14b8a6', // Teal
                visible: true,
                isRecommended: true,
                coordinates: mapGridToCoords(data.a_star_path, start, end, gridSize)
            });
        }

        // 2. Dijkstra (Maximum Safety/Cleanliness)
        if (data.dijkstra_path) {
            routes.push({
                id: `dijkstra-${Date.now()}`,
                name: 'Cleanest Air Path',
                algorithm: "Dijkstra's Algorithm",
                duration: '18 min',
                distance: '1.9 km',
                pollutionScore: 25,
                inhaledDose: 60,
                color: '#22c55e', // Green
                visible: true,
                isRecommended: false,
                coordinates: mapGridToCoords(data.dijkstra_path, start, end, gridSize)
            });
        }

        // 3. BFS (Shortest physical distance)
        if (data.bfs_path) {
            routes.push({
                id: `bfs-${Date.now()}`,
                name: 'Direct Map Path',
                algorithm: 'BFS (Shortest)',
                duration: '10 min',
                distance: '1.0 km',
                pollutionScore: 65,
                inhaledDose: 145,
                color: '#8b5cf6', // Purple
                visible: true,
                isRecommended: false,
                coordinates: mapGridToCoords(data.bfs_path, start, end, gridSize)
            });
        }

        // 4. DFS (Exploratory path)
        if (data.dfs_path) {
            routes.push({
                id: `dfs-${Date.now()}`,
                name: 'Alternative Explorer',
                algorithm: 'DFS (Depth-First)',
                duration: '22 min',
                distance: '2.4 km',
                pollutionScore: 55,
                inhaledDose: 115,
                color: '#f97316', // Orange
                visible: true,
                isRecommended: false,
                coordinates: mapGridToCoords(data.dfs_path, start, end, gridSize)
            });
        }

        return routes;
    } catch (error) {
        console.error('Error calling Python pathfinding API:', error);
        return [];
    }
};

export const getRoutes = async (
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    mode: 'pedestrian' | 'cyclist' = 'pedestrian'
): Promise<RouteData[]> => {
    try {
        const pythonRoutes = await getPythonRoutes(start, end);

        // Fetch TomTom as a baseline if key is present
        let tomTomRoutes: RouteData[] = [];
        if (TOMTOM_API_KEY) {
            try {
                const travelMode = mode === 'cyclist' ? 'bicycle' : 'pedestrian';
                const url = `https://api.tomtom.com/routing/1/calculateRoute/${start.lat},${start.lon}:${end.lat},${end.lon}/json?key=${TOMTOM_API_KEY}&traffic=true&routeType=fastest&maxAlternatives=1&travelMode=${travelMode}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data.routes?.[0]) {
                        const route = data.routes[0];
                        const coordinates: LatLngExpression[] = route.legs[0].points.map((p: any) => [p.latitude, p.longitude]);
                        const pollutionData = await getRoutePollutionScore(coordinates as [number, number][]);
                        
                        tomTomRoutes.push({
                            id: `fastest-${Date.now()}`,
                            name: 'Standard Route',
                            algorithm: 'Traffic-Aware routing',
                            duration: `${Math.round(route.summary.travelTimeInSeconds / 60)} min`,
                            distance: `${(route.summary.lengthInMeters / 1000).toFixed(1)} km`,
                            pollutionScore: pollutionData.aqi,
                            inhaledDose: Math.round(15 * (route.summary.travelTimeInSeconds / 60) * (pollutionData.aqi / 1000)),
                            color: '#2563eb', // Blue
                            visible: true,
                            isRecommended: false,
                            coordinates
                        });
                    }
                }
            } catch (err) {
                console.warn("TomTom failed, continuing with custom algorithms");
            }
        }

        // ---------------------------------------------------------------
        // Dijkstra route on AQI-weighted Delhi graph (Unit III)
        // ---------------------------------------------------------------
        const dijkstraResult = dijkstra(DELHI_GRAPH, 'Connaught Place');
        const dijkstraPath = reconstructPath(dijkstraResult.predecessors, 'India Gate');
        const dijkstraDistance = dijkstraResult.distances['India Gate'];

        const nodeCoords: Record<string, [number, number]> = {
            'Connaught Place': [28.6315, 77.2167],
            'Rajiv Chowk':     [28.6328, 77.2197],
            'India Gate':      [28.6129, 77.2295],
            'Karol Bagh':      [28.6517, 77.1902],
            'Lodhi Colony':    [28.5921, 77.2238],
            'Pragati Maidan':  [28.6133, 77.2429],
            'Patel Nagar':     [28.6531, 77.1726],
        };
        const dijkstraCoords: LatLngExpression[] = dijkstraPath
            .filter(n => nodeCoords[n])
            .map(n => nodeCoords[n]);

        const dijkstraRoute: RouteData = {
            id: `dijkstra-aqi-${Date.now()}`,
            name: 'Cleanest Air Path',
            algorithm: "Dijkstra's Algorithm (AQI-weighted)",
            duration: `${Math.round(dijkstraDistance * 12)} min`,
            distance: `${dijkstraDistance.toFixed(1)} km`,
            pollutionScore: Math.round(dijkstraDistance * 14),
            inhaledDose: Math.round(dijkstraDistance * 30),
            color: '#22c55e',
            visible: true,
            isRecommended: true,
            coordinates: dijkstraCoords,
        };

        const allRoutes = [...pythonRoutes, ...tomTomRoutes, dijkstraRoute];
        return allRoutes;

    } catch (error) {
        console.error('Error fetching routes:', error);
        return [];
    }
};
