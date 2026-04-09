/**
 * Greedy Route Scoring — Activity Selection on Road Segments
 *
 * DAA Concept (Unit II — Greedy Algorithms):
 * The Activity Selection Problem selects the maximum number of
 * non-overlapping intervals. Here each road segment is an "activity"
 * with a start/end position along the route and a pollution cost.
 * The greedy strategy: sort segments by end position, then iteratively
 * pick the next non-overlapping segment with the lowest AQI penalty.
 * This runs in O(n log n) dominated by the sort step.
 *
 * Real-world use in BreatheWay:
 * A long route can be divided into road segments that overlap (e.g. one
 * segment might cut through an intersection covered by multiple readings).
 * The greedy selector picks a non-overlapping subset of segments that
 * collectively minimises total pollution exposure — essentially choosing
 * the "cleanest lane" at each junction.
 */

export const GREEDY_COMPLEXITY = 'O(n log n)';
export const GREEDY_SPACE = 'O(n)';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteSegment {
  id: string;
  /** Start position along route (0–1 normalised or km) */
  start: number;
  /** End position along route */
  end: number;
  /** Average AQI for this segment — lower is cleaner */
  aqiCost: number;
  label?: string;
}

export interface GreedyResult {
  selected: RouteSegment[];
  totalAQI: number;
  coverageRatio: number;
}

// ---------------------------------------------------------------------------
// Greedy Clean-Route Selector
// ---------------------------------------------------------------------------

/**
 * Selects a set of non-overlapping route segments that minimises total
 * AQI exposure using a greedy activity-selection approach.
 *
 * Greedy choice: among all segments starting after the last selected
 * segment ends, pick the one with the lowest aqiCost first.
 *
 * @param segments  Array of road segments with start, end, and AQI cost
 * @returns         Selected non-overlapping segments, total AQI, coverage
 */
export function greedyCleanRoute(segments: RouteSegment[]): GreedyResult {
  if (segments.length === 0) {
    return { selected: [], totalAQI: 0, coverageRatio: 0 };
  }

  // Sort by end position (Activity Selection canonical sort)
  const sorted = [...segments].sort((a, b) => a.end - b.end);

  const selected: RouteSegment[] = [];
  let lastEnd = -Infinity;

  for (const seg of sorted) {
    if (seg.start >= lastEnd) {
      // This segment does not overlap with the last selected one
      // Among all non-overlapping candidates starting here, this is the
      // earliest-finishing (greedy choice) — pick it
      selected.push(seg);
      lastEnd = seg.end;
    }
  }

  const totalAQI = selected.reduce((sum, s) => sum + s.aqiCost, 0);
  const routeLength = Math.max(...segments.map(s => s.end));
  const coveredLength = selected.reduce((sum, s) => sum + (s.end - s.start), 0);
  const coverageRatio = routeLength > 0 ? coveredLength / routeLength : 0;

  return { selected, totalAQI, coverageRatio };
}

// ---------------------------------------------------------------------------
// Sample Delhi route segments (used by UI for demo)
// ---------------------------------------------------------------------------

export const SAMPLE_DELHI_SEGMENTS: RouteSegment[] = [
  { id: 's1', start: 0.0, end: 0.4, aqiCost: 42,  label: 'Connaught Place → Rajpath' },
  { id: 's2', start: 0.2, end: 0.6, aqiCost: 78,  label: 'Ring Road stretch (high traffic)' },
  { id: 's3', start: 0.4, end: 0.7, aqiCost: 35,  label: 'Lodhi Garden corridor (green belt)' },
  { id: 's4', start: 0.6, end: 0.9, aqiCost: 55,  label: 'India Gate approach' },
  { id: 's5', start: 0.7, end: 1.0, aqiCost: 48,  label: 'Kartavya Path (tree-lined)' },
  { id: 's6', start: 0.0, end: 0.3, aqiCost: 90,  label: 'Overhead flyover (diesel exhaust)' },
  { id: 's7', start: 0.3, end: 0.65, aqiCost: 30, label: 'Safdarjung Flyover bypass (clean)' },
];
