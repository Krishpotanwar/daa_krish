import { LatLngExpression } from 'leaflet';

export interface RouteData {
  id: string;
  name: string;
  algorithm: string;
  duration: string;
  distance: string;
  pollutionScore: number;
  inhaledDose: number;
  color: string;
  visible: boolean;
  isRecommended?: boolean;
  warning?: string;
  coordinates: LatLngExpression[];
}

export interface PollutionZone {
  center: LatLngExpression;
  radius: number;
  level: 'low' | 'moderate' | 'high';
}

// Delhi, India coordinates (Connaught Place area)
export const startPoint: LatLngExpression = [28.6295, 77.2185]; // Connaught Place (Inner Circle)
export const endPoint: LatLngExpression = [28.6129, 77.2295]; // India Gate

// Mock route data with realistic Delhi coordinates
export const mockRoutes: RouteData[] = [
  {
    id: 'fastest',
    name: 'Fastest Route',
    algorithm: 'Weighted A*',
    duration: '15 min',
    distance: '2.5 km',
    pollutionScore: 85,
    inhaledDose: 195,
    color: '#ef4444',
    visible: true,
    coordinates: [
      [28.6295, 77.2185], // Start - Connaught Place
      [28.6280, 77.2190],
      [28.6250, 77.2200], // Janpath Road
      [28.6220, 77.2220],
      [28.6180, 77.2250],
      [28.6150, 77.2270],
      [28.6129, 77.2295], // End - India Gate
    ],
  },
  {
    id: 'cleanest',
    name: 'Cleanest Route',
    algorithm: 'Heuristic BFS',
    duration: '22 min',
    distance: '3.1 km',
    pollutionScore: 45,
    inhaledDose: 85,
    color: '#22c55e',
    visible: true,
    coordinates: [
      [28.6295, 77.2185], // Start - Connaught Place
      [28.6310, 77.2160], // Detour through quieter roads
      [28.6280, 77.2130],
      [28.6250, 77.2150],
      [28.6200, 77.2180], // Kasturba Gandhi Marg area
      [28.6160, 77.2240],
      [28.6129, 77.2295], // End - India Gate
    ],
  },
  {
    id: 'health',
    name: 'Health-Optimized',
    algorithm: 'Multi-Objective A*',
    duration: '18 min',
    distance: '2.8 km',
    pollutionScore: 55,
    inhaledDose: 110,
    color: '#14b8a6',
    visible: true,
    isRecommended: true,
    coordinates: [
      [28.6295, 77.2185], // Start - Connaught Place
      [28.6270, 77.2170],
      [28.6240, 77.2190], // Balanced route
      [28.6210, 77.2210],
      [28.6180, 77.2240],
      [28.6140, 77.2260],
      [28.6129, 77.2295], // End - India Gate
    ],
  },
];

// Pollution hotspots in the area (Delhi)
export const pollutionZones: PollutionZone[] = [
  { center: [28.6220, 77.2220], radius: 25, level: 'high' }, // Busy Janpath crossing
  { center: [28.6250, 77.2200], radius: 20, level: 'moderate' },
  { center: [28.6180, 77.2250], radius: 30, level: 'high' }, // Near India Gate circle
  { center: [28.6310, 77.2160], radius: 35, level: 'low' }, // Quieter area
  { center: [28.6200, 77.2180], radius: 25, level: 'low' },
];

// Air quality data simulation (Delhi - Poor Air Quality)
export const airQualityData = {
  overall: 142,
  status: 'Unhealthy for Sensitive Groups',
  pm25: 55.5,
  no2: 48,
  o3: 45,
  lastUpdated: new Date().toISOString(),
};

// WHO exposure limits
export const whoLimits = {
  pm25Daily: 15, // µg/m³
  no2Annual: 10, // µg/m³
};

// Calculate exposure time to exceed WHO limit
export const calculateExceedanceTime = (routePollutionScore: number): number => {
  // Simplified calculation - higher pollution = faster exceedance
  const baseTime = 60; // minutes at baseline
  return Math.round(baseTime * (50 / routePollutionScore));
};
