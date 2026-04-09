import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  DIJKSTRA_COMPLEXITY, DIJKSTRA_SPACE,
  BELLMAN_FORD_COMPLEXITY, BELLMAN_FORD_SPACE,
  DELHI_GRAPH,
} from '@/algorithms/shortestPath';
import { GREEDY_COMPLEXITY, GREEDY_SPACE, SAMPLE_DELHI_SEGMENTS } from '@/algorithms/greedyRouting';
import { CLOSEST_PAIR_COMPLEXITY, CLOSEST_PAIR_SPACE, DELHI_STATIONS } from '@/algorithms/closestPair';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const algorithms = [
  {
    name: "Dijkstra's Algorithm",
    subtitle: 'Bellman-Ford (alternative)',
    unit: 'Unit III',
    unitLabel: 'Greedy on Graphs / Single-Source Shortest Path',
    color: 'bg-green-500/10 border-green-500/30',
    badgeColor: 'bg-green-600 text-white',
    complexity: DIJKSTRA_COMPLEXITY,
    space: DIJKSTRA_SPACE,
    altComplexity: `Bellman-Ford: ${BELLMAN_FORD_COMPLEXITY} / ${BELLMAN_FORD_SPACE}`,
    description:
      'Finds the minimum-cost path from a source node to all other nodes ' +
      'using a greedy min-priority-queue. Edge weights in BreatheWay combine ' +
      'physical distance and AQI penalty — so the algorithm naturally avoids ' +
      'polluted corridors.',
    use: 'Powers the "Cleanest Air Path" route card. The Delhi city graph has 7 nodes ' +
      '(Connaught Place, India Gate, Karol Bagh, Rajiv Chowk, Lodhi Colony, ' +
      'Pragati Maidan, Patel Nagar) connected by AQI-weighted edges.',
    table: {
      headers: ['From', 'To', 'Weight (dist + AQI penalty)'],
      rows: Object.entries(DELHI_GRAPH).flatMap(([from, edges]) =>
        edges.map(e => [from, e.to, e.weight.toFixed(1)])
      ).slice(0, 8),
    },
  },
  {
    name: 'Greedy Activity Selection',
    subtitle: 'Applied to road segments',
    unit: 'Unit II',
    unitLabel: 'Greedy Algorithms',
    color: 'bg-blue-500/10 border-blue-500/30',
    badgeColor: 'bg-blue-600 text-white',
    complexity: GREEDY_COMPLEXITY,
    space: GREEDY_SPACE,
    description:
      'Each road segment is modelled as an interval [start, end] with an ' +
      'AQI cost. The greedy strategy sorts segments by end position and ' +
      'selects non-overlapping ones with the lowest cumulative pollution — ' +
      'a direct application of the Activity Selection Problem.',
    use: 'Used to score route alternatives: overlapping segments (e.g. a fly-over ' +
      'and a parallel green belt road) are compared and the cleaner, ' +
      'non-overlapping subset is chosen.',
    table: {
      headers: ['Segment', 'Start', 'End', 'AQI Cost'],
      rows: SAMPLE_DELHI_SEGMENTS.map(s => [
        s.label ?? s.id, s.start.toFixed(1), s.end.toFixed(1), String(s.aqiCost),
      ]),
    },
  },
  {
    name: 'Closest Pair of Points',
    subtitle: 'Divide and Conquer — O(n log² n)',
    unit: 'Unit IV',
    unitLabel: 'Divide and Conquer',
    color: 'bg-purple-500/10 border-purple-500/30',
    badgeColor: 'bg-purple-600 text-white',
    complexity: CLOSEST_PAIR_COMPLEXITY,
    space: CLOSEST_PAIR_SPACE,
    description:
      'Splits the point set at the median x-coordinate, recursively finds ' +
      'the closest pair in each half, then checks the strip of width 2δ ' +
      'around the dividing line. Overall O(n log² n) vs naïve O(n²).',
    use: 'For every GPS coordinate along a route, BreatheWay snaps it to the ' +
      'nearest CPCB pollution monitoring station using this algorithm. This ' +
      'ensures AQI readings come from real sensors, not arbitrary map coords.',
    table: {
      headers: ['Station', 'Lat', 'Lon', 'Current AQI'],
      rows: DELHI_STATIONS.map(s => [
        s.stationName, s.y.toFixed(4), s.x.toFixed(4), String(s.currentAQI),
      ]),
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlgorithmsPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Map
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-1">Algorithms Used</h1>
        <p className="text-muted-foreground">
          DAA Lab Project — 24CS03TH0402 | RBU Nagpur, B.Tech CSE, Sem IV
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Units II, III &amp; IV of the Design and Analysis of Algorithms syllabus,
          applied to real-world air-quality-aware navigation.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto space-y-6">
        {algorithms.map((algo) => (
          <Card key={algo.name} className={`border ${algo.color}`}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <CardTitle className="text-xl">{algo.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{algo.subtitle}</p>
                </div>
                <Badge className={`${algo.badgeColor} shrink-0`}>
                  {algo.unit} — {algo.unitLabel}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Complexity row */}
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  <span className="font-semibold">Time: </span>
                  <code className="bg-muted px-1 rounded">{algo.complexity}</code>
                </span>
                <span>
                  <span className="font-semibold">Space: </span>
                  <code className="bg-muted px-1 rounded">{algo.space}</code>
                </span>
                {algo.altComplexity && (
                  <span className="text-muted-foreground">{algo.altComplexity}</span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-foreground/80">{algo.description}</p>

              {/* Real-world use */}
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  How it's used in BreatheWay
                </p>
                <p className="text-sm">{algo.use}</p>
              </div>

              {/* Static data table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {algo.table.headers.map((h) => (
                        <th key={h} className="text-left py-1 px-2 text-muted-foreground font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {algo.table.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        {row.map((cell, j) => (
                          <td key={j} className="py-1 px-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
