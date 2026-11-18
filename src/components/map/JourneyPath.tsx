"use client";

import { useMemo } from "react";
import type { MapMarker } from "@/types/map-marker";

type JourneyPathProps = {
  markers: MapMarker[];
  pathIds: string[];
};

type Point = { x: number; y: number };

/** Smooth cubic path through stops (Catmull-Rom → Bezier), matching Figma’s curved journey. */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Rama’s journey line — Figma Explore map:
 * soft translucent underlay + gold dashed stroke (#FFAD16).
 */
export function JourneyPath({ markers: allMarkers, pathIds }: JourneyPathProps) {
  const d = useMemo(() => {
    const byId = new Map(allMarkers.map((m) => [m.id, m]));
    const points = pathIds
      .map((id) => byId.get(id))
      .filter((m): m is MapMarker => Boolean(m))
      .map((m) => ({ x: m.xPercent, y: m.yPercent }));
    return smoothPath(points);
  }, [allMarkers, pathIds]);

  if (!d) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Soft translucent road bed (Figma: white @ 20% opacity, wide stroke) */}
      <path
        d={d}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.2}
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Warm glow under the gold dashes */}
      <path
        d={d}
        fill="none"
        stroke="#FFAD16"
        strokeOpacity={0.28}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Gold dashed journey — Figma stroke #FFAD16 */}
      <path
        d={d}
        fill="none"
        stroke="#FFAD16"
        strokeOpacity={0.95}
        strokeWidth={2}
        strokeDasharray="5 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
