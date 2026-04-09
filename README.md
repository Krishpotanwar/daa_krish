# BreatheWay — Air-Quality-Aware Route Navigation

> **DAA Lab Project** | Course: 24CS03TH0402
> RBU Nagpur, B.Tech CSE, Semester IV

BreatheWay is an intelligent, health-focused route navigation app that prioritises air quality over speed — designed for pedestrians and cyclists who want to minimise respiratory health risks in polluted urban areas.

**Live Demo:** https://daakrish.vercel.app

---

## Team Members

| Name | Roll No | GitHub | Role |
|------|---------|--------|------|
| Krish Potanwar | C1_A1_14 | [@Krishpotanwar](https://github.com/Krishpotanwar) | Primary Developer — routing logic, Dijkstra integration, backend services |
| Mohisha Punwatkar | C1_A1_13 | https://github.com/mohisha01 | Creative Frontend Design — UI/UX, Algorithm Info Page |
| Dhanashree Sainis | C1_A1_05 | https://github.com/Dhanashreesainis| Contributing in Both — Bellman-Ford, Closest Pair, Greedy Routing |

---

## Algorithms Used

All algorithm implementations live in `src/algorithms/` and are wired into the live application.

### Unit II — Greedy Algorithms

**File:** `src/algorithms/greedyRouting.ts`
**Algorithm:** Activity Selection Problem applied to road segments

Each road segment is an interval `[start, end]` with an AQI pollution cost. The greedy strategy sorts by end position and picks non-overlapping segments with the lowest cumulative AQI — directly applying the Activity Selection Problem to real routing.

- **Time Complexity:** O(n log n) | **Space:** O(n)
- **Real use in app:** Scores route alternatives by selecting the non-overlapping, lowest-pollution subset of road segments at each junction.

---

### Unit III — Single-Source Shortest Path

**File:** `src/algorithms/shortestPath.ts`
**Algorithms:** Dijkstra's Algorithm + Bellman-Ford (alternative)

A weighted graph of 7 Delhi city locations (Connaught Place, India Gate, Karol Bagh, Rajiv Chowk, Lodhi Colony, Pragati Maidan, Patel Nagar) uses edge weights = `distance_km + AQI_penalty`. Dijkstra finds the cleanest path; Bellman-Ford is the negative-edge-safe alternative.

- **Dijkstra:** O((V + E) log V) time, O(V) space
- **Bellman-Ford:** O(V · E) time, O(V) space
- **Real use in app:** Powers the "Cleanest Air Path" route card shown on the map.

---

### Unit IV — Divide and Conquer

**File:** `src/algorithms/closestPair.ts`
**Algorithm:** Closest Pair of Points — O(n log² n)

Splits the point set at the median x-coordinate, recurses on each half, then checks the 2δ-wide strip around the dividing line. Runs in O(n log² n) vs the naïve O(n²).

- **Time Complexity:** O(n log² n) | **Space:** O(n)
- **Real use in app:** For every GPS coordinate along a computed route, finds the nearest CPCB pollution monitoring station. AQI queries are snapped to real sensors instead of arbitrary map coordinates.

---

## Running the App

```bash
npm install
npm run dev        # localhost:5173
npm run build
npm run test
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Mapping | Leaflet + React-Leaflet |
| Routing | OSRM + TomTom (optional key) |
| Air Quality | Open-Meteo Air Quality API |

---

## Project Structure

```
src/
├── algorithms/
│   ├── shortestPath.ts    # Dijkstra + Bellman-Ford  (Unit III)
│   ├── greedyRouting.ts   # Activity Selection        (Unit II)
│   └── closestPair.ts     # Closest Pair D&C          (Unit IV)
├── pages/
│   └── AlgorithmsPage.tsx # /algorithms — info page
├── services/
│   ├── routingService.ts  # Dijkstra wired into route scoring
│   └── pollutionService.ts# closestPair used for station snapping
└── components/
    └── Header.tsx         # "Algorithms" nav link
```

---

*BreatheWay — Breathe Easier. Navigate Smarter.*
