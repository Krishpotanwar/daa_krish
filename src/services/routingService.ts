import { LatLngExpression } from 'leaflet';
import { RouteData } from '@/data/routeData';
import { getRoutePollutionScore } from './pollutionService';
import { lungHealthScoringService } from './lungHealthScoringService';
import { dijkstra, reconstructPath, buildGraphFromPoints, haversineKm, GeoNode } from '@/algorithms/shortestPath';
import { getPollutionData } from './pollutionService';

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
        // Dijkstra on a DYNAMIC AQI-weighted graph — works for any city
        //
        // 1. Interpolate 6 waypoints between user's actual start & end coords
        // 2. Add 2 perpendicular "detour" nodes at mid-route for branching
        // 3. Fetch live AQI from Open-Meteo for each node (global coverage)
        // 4. Build graph: edge weight = haversine_km + AQI_penalty
        // 5. Run Dijkstra → picks the minimum pollution-cost path
        // ---------------------------------------------------------------
        let dijkstraRoute: RouteData | null = null;
        try {
            const NUM_MAIN = 6;
            const rawNodes: { id: string; lat: number; lon: number }[] = [];

            // Linearly interpolated nodes along the route
            for (let i = 0; i < NUM_MAIN; i++) {
                const t = i / (NUM_MAIN - 1);
                rawNodes.push({
                    id: i === 0 ? 'source' : i === NUM_MAIN - 1 ? 'destination' : `node_${i}`,
                    lat: start.lat + t * (end.lat - start.lat),
                    lon: start.lon + t * (end.lon - start.lon),
                });
            }

            // Perpendicular detour nodes — give the graph real branching alternatives
            const perpLat = (end.lon - start.lon) * 0.008;
            const perpLon = -(end.lat - start.lat) * 0.008;
            const midLat = (start.lat + end.lat) / 2;
            const midLon = (start.lon + end.lon) / 2;
            rawNodes.push({ id: 'detour_a', lat: midLat + perpLat, lon: midLon + perpLon });
            rawNodes.push({ id: 'detour_b', lat: midLat - perpLat, lon: midLon - perpLon });

            // Fetch live AQI for all nodes in parallel (Open-Meteo — global)
            const aqiResults = await Promise.all(
                rawNodes.map(n => getPollutionData(n.lat, n.lon))
            );

            const geoNodes: GeoNode[] = rawNodes.map((n, i) => ({
                ...n,
                aqi: aqiResults[i]?.aqi ?? 50,
            }));

            // Build dynamic graph and run Dijkstra
            const totalDist = haversineKm(start.lat, start.lon, end.lat, end.lon);
            const graph = buildGraphFromPoints(geoNodes, totalDist * 1.5);
            const result = dijkstra(graph, 'source');
            const path = reconstructPath(result.predecessors, 'destination');

            if (path.length >= 2 && result.distances['destination'] !== Infinity) {
                const pathCoords: LatLngExpression[] = path
                    .map(id => geoNodes.find(n => n.id === id))
                    .filter(Boolean)
                    .map(n => [n!.lat, n!.lon]);

                const avgAqi = geoNodes.reduce((s, n) => s + n.aqi, 0) / geoNodes.length;

                dijkstraRoute = {
                    id: `dijkstra-dynamic-${Date.now()}`,
                    name: 'Cleanest Air Path',
                    algorithm: "Dijkstra's Algorithm (AQI-weighted)",
                    duration: `${Math.round(totalDist * 12)} min`,
                    distance: `${totalDist.toFixed(1)} km`,
                    pollutionScore: Math.round(avgAqi * 0.8),
                    inhaledDose: Math.round(totalDist * 30),
                    color: '#22c55e',
                    visible: true,
                    isRecommended: true,
                    coordinates: pathCoords,
                };
            }
        } catch (dijkstraErr) {
            console.warn('Dynamic Dijkstra failed, skipping:', dijkstraErr);
        }

        const allRoutes = [...pythonRoutes, ...tomTomRoutes];
        if (dijkstraRoute) allRoutes.push(dijkstraRoute);

        return allRoutes;

    } catch (error) {
        console.error('Error fetching routes:', error);
        return [];
    }
};
