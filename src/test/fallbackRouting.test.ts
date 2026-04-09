import { describe, expect, it } from 'vitest';
import { buildFallbackRoutes } from '@/services/fallbackRouting';

describe('buildFallbackRoutes', () => {
  it('returns three usable route options with a recommended clean route', () => {
    const routes = buildFallbackRoutes(
      { lat: 28.6295, lon: 77.2185 },
      { lat: 28.6129, lon: 77.2295 },
      'pedestrian'
    );

    expect(routes).toHaveLength(3);
    expect(routes[0].isRecommended).toBe(true);
    expect(routes.some((route) => route.id.includes('fastest'))).toBe(true);
    expect(routes.every((route) => route.coordinates.length >= 10)).toBe(true);
  });
});
