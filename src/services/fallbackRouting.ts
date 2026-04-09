import { RouteData } from '@/data/routeData';

type TravelMode = 'pedestrian' | 'cyclist';

interface Coordinate {
  lat: number;
  lon: number;
}

interface RouteVariant {
  id: string;
  name: string;
  algorithm: string;
  color: string;
  isRecommended?: boolean;
  curvature: number;
  direction: number;
  pollutionBias: number;
}

const KM_PER_LAT = 110.574;

const ROUTE_VARIANTS: RouteVariant[] = [
  {
    id: 'health-fallback',
    name: 'Cleanest Air Path',
    algorithm: 'Dijkstra (AQI-weighted fallback)',
    color: '#22c55e',
    isRecommended: true,
    curvature: 0.32,
    direction: 1,
    pollutionBias: -14,
  },
  {
    id: 'balanced-fallback',
    name: 'Balanced Route',
    algorithm: 'Greedy Selection (fallback)',
    color: '#14b8a6',
    curvature: 0.2,
    direction: -1,
    pollutionBias: -4,
  },
  {
    id: 'fastest-fallback',
    name: 'Fastest Route',
    algorithm: 'Heuristic Baseline (fallback)',
    color: '#2563eb',
    curvature: 0.06,
    direction: 1,
    pollutionBias: 16,
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getKmPerLon = (lat: number) => Math.max(111.320 * Math.cos((lat * Math.PI) / 180), 0.1);

const haversineKm = (start: Coordinate, end: Coordinate) => {
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLon = ((end.lon - start.lon) * Math.PI) / 180;
  const lat1 = (start.lat * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getPerpendicularOffset = (
  start: Coordinate,
  end: Coordinate,
  offsetKm: number
) => {
  const averageLat = (start.lat + end.lat) / 2;
  const kmPerLon = getKmPerLon(averageLat);
  const deltaXKm = (end.lon - start.lon) * kmPerLon;
  const deltaYKm = (end.lat - start.lat) * KM_PER_LAT;
  const magnitude = Math.hypot(deltaXKm, deltaYKm) || 1;

  const perpendicularXKm = -deltaYKm / magnitude;
  const perpendicularYKm = deltaXKm / magnitude;

  return {
    lat: (perpendicularYKm * offsetKm) / KM_PER_LAT,
    lon: (perpendicularXKm * offsetKm) / kmPerLon,
  };
};

const cubicBezier = (
  start: Coordinate,
  control1: Coordinate,
  control2: Coordinate,
  end: Coordinate,
  t: number
): Coordinate => {
  const inv = 1 - t;
  const inv2 = inv * inv;
  const inv3 = inv2 * inv;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    lat:
      inv3 * start.lat +
      3 * inv2 * t * control1.lat +
      3 * inv * t2 * control2.lat +
      t3 * end.lat,
    lon:
      inv3 * start.lon +
      3 * inv2 * t * control1.lon +
      3 * inv * t2 * control2.lon +
      t3 * end.lon,
  };
};

const toLatLngPairs = (points: Coordinate[]) => points.map((point) => [point.lat, point.lon] as [number, number]);

const buildRouteShape = (start: Coordinate, end: Coordinate, variant: RouteVariant) => {
  const directDistanceKm = haversineKm(start, end);
  const offsetKm = clamp(directDistanceKm * variant.curvature, 0.2, 1.4) * variant.direction;
  const offset = getPerpendicularOffset(start, end, offsetKm);

  const control1: Coordinate = {
    lat: start.lat + (end.lat - start.lat) * 0.34 + offset.lat,
    lon: start.lon + (end.lon - start.lon) * 0.34 + offset.lon,
  };

  const control2: Coordinate = {
    lat: start.lat + (end.lat - start.lat) * 0.72 + offset.lat * 0.6,
    lon: start.lon + (end.lon - start.lon) * 0.72 + offset.lon * 0.6,
  };

  const points = Array.from({ length: 18 }, (_, index) =>
    cubicBezier(start, control1, control2, end, index / 17)
  );

  const distanceKm = points.slice(1).reduce((total, point, index) => {
    return total + haversineKm(points[index], point);
  }, 0);

  return { points, distanceKm };
};

const estimateAmbientAqi = (start: Coordinate, end: Coordinate, distanceKm: number) => {
  const midLat = (start.lat + end.lat) / 2;
  const midLon = (start.lon + end.lon) / 2;
  const geoNoise =
    Math.sin(midLat * 18.7) * 11 +
    Math.cos(midLon * 13.3) * 9 +
    Math.sin((midLat + midLon) * 7.1) * 6;

  return clamp(Math.round(78 + geoNoise + distanceKm * 6), 48, 150);
};

const estimateDurationMinutes = (distanceKm: number, mode: TravelMode) => {
  const speedKmh = mode === 'cyclist' ? 14 : 4.8;
  return Math.max(4, Math.round((distanceKm / speedKmh) * 60));
};

const estimateInhaledDose = (aqi: number, durationMinutes: number, mode: TravelMode) => {
  const ventilationFactor = mode === 'cyclist' ? 0.14 : 0.08;
  return Math.round(aqi * durationMinutes * ventilationFactor);
};

export const buildFallbackRoutes = (
  start: Coordinate,
  end: Coordinate,
  mode: TravelMode
): RouteData[] => {
  return ROUTE_VARIANTS.map((variant) => {
    const { points, distanceKm } = buildRouteShape(start, end, variant);
    const durationMinutes = estimateDurationMinutes(distanceKm, mode);
    const ambientAqi = estimateAmbientAqi(start, end, distanceKm);
    const pollutionScore = clamp(ambientAqi + variant.pollutionBias, 32, 180);

    return {
      id: variant.id,
      name: variant.name,
      algorithm: variant.algorithm,
      duration: `${durationMinutes} min`,
      distance: `${distanceKm.toFixed(1)} km`,
      pollutionScore,
      inhaledDose: estimateInhaledDose(pollutionScore, durationMinutes, mode),
      color: variant.color,
      visible: true,
      isRecommended: variant.isRecommended,
      coordinates: toLatLngPairs(points),
    };
  });
};
