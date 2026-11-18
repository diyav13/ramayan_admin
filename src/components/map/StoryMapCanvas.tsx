"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { JourneyPath } from "@/components/map/JourneyPath";
import { MapMarkerPin } from "@/components/map/MapMarkerPin";
import {
  MAP_ZOOM_MAX,
  MAP_ZOOM_MIN,
  MAP_ZOOM_STEP,
  STORY_MAP_ASPECT,
  STORY_MAP_IMAGE,
  clampPercent,
  clampZoom,
  zoomToPercent,
} from "@/lib/map/placements";
import type { MapMarker, MapPoint } from "@/types/map-marker";

type StoryMapCanvasProps = {
  markers: MapMarker[];
  pathIds: string[];
  selectedId: string | null;
  /** When true, empty map clicks drop a new pin. */
  placing: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onSelect: (id: string | null) => void;
  onPlace: (point: MapPoint) => void;
  onMove: (id: string, point: MapPoint) => void;
};

type ViewportSize = { width: number; height: number };

type ZoomAnchor = {
  /** 0–1 position on the map surface */
  sx: number;
  sy: number;
  /** Cursor offset inside the viewport */
  ox: number;
  oy: number;
};

function pointFromEvent(
  event: { clientX: number; clientY: number },
  el: HTMLElement
): MapPoint {
  const rect = el.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  return { xPercent: clampPercent(x), yPercent: clampPercent(y) };
}

/**
 * 0% zoom (factor 1) = map fills the map-view height (never shorter).
 * Wider-than-view maps scroll horizontally at 0%.
 */
function fitBaseSize(viewport: ViewportSize): { width: number; height: number } {
  const { height: availH } = viewport;
  if (availH <= 0) return { width: 0, height: 0 };
  const height = availH;
  const width = height * STORY_MAP_ASPECT;
  return { width, height };
}

export function StoryMapCanvas({
  markers,
  pathIds,
  selectedId,
  placing,
  zoom,
  onZoomChange,
  onSelect,
  onPlace,
  onMove,
}: StoryMapCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const pendingAnchorRef = useRef<ZoomAnchor | null>(null);
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    moved: boolean;
  } | null>(null);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const [viewport, setViewport] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  zoomRef.current = zoom;
  const pathIndexById = new Map(pathIds.map((id, index) => [id, index]));

  const base = fitBaseSize(viewport);
  const scaledW = base.width * zoom;
  const scaledH = base.height * zoom;
  const canPan =
    scaledW > viewport.width + 1 || scaledH > viewport.height + 1;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setViewport({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const anchor = pendingAnchorRef.current;
    if (!vp || !anchor || scaledW <= 0 || scaledH <= 0) return;

    const frameW = Math.max(scaledW, vp.clientWidth);
    const frameH = Math.max(scaledH, vp.clientHeight);
    const surfaceLeft = (frameW - scaledW) / 2;
    const surfaceTop = (frameH - scaledH) / 2;

    vp.scrollLeft = surfaceLeft + anchor.sx * scaledW - anchor.ox;
    vp.scrollTop = surfaceTop + anchor.sy * scaledH - anchor.oy;
    pendingAnchorRef.current = null;
  }, [zoom, scaledW, scaledH]);

  const applyZoom = useCallback(
    (nextZoom: number, clientX?: number, clientY?: number) => {
      const vp = viewportRef.current;
      const surface = surfaceRef.current;
      const z0 = zoomRef.current;
      const z1 = clampZoom(nextZoom);
      if (z1 === z0) return;

      if (vp) {
        const vpRect = vp.getBoundingClientRect();
        const ox = clientX != null ? clientX - vpRect.left : vp.clientWidth / 2;
        const oy = clientY != null ? clientY - vpRect.top : vp.clientHeight / 2;

        let sx = 0.5;
        let sy = 0.5;
        if (surface && surface.clientWidth > 0 && surface.clientHeight > 0) {
          const sRect = surface.getBoundingClientRect();
          if (clientX != null && clientY != null) {
            sx = (clientX - sRect.left) / sRect.width;
            sy = (clientY - sRect.top) / sRect.height;
          } else {
            sx = (vp.scrollLeft + ox - (sRect.left - vpRect.left)) / sRect.width;
            sy = (vp.scrollTop + oy - (sRect.top - vpRect.top)) / sRect.height;
          }
          sx = Math.min(1, Math.max(0, sx));
          sy = Math.min(1, Math.max(0, sy));
        }

        pendingAnchorRef.current = { sx, sy, ox, oy };
      }

      onZoomChange(z1);
    },
    [onZoomChange]
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      // Trackpads send many small deltas; normalize to a stable step.
      const direction = event.deltaY > 0 ? -1 : 1;
      const step =
        Math.abs(event.deltaY) < 8 ? MAP_ZOOM_STEP / 2 : MAP_ZOOM_STEP;
      applyZoom(zoomRef.current + direction * step, event.clientX, event.clientY);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  const handleSurfaceClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!surfaceRef.current) return;
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (dragRef.current || panRef.current?.moved) return;

      if (placing) {
        onPlace(pointFromEvent(event, surfaceRef.current));
        return;
      }
      onSelect(null);
    },
    [onPlace, onSelect, placing]
  );

  const handleMarkerSelect = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect]
  );

  const handleDragStart = useCallback(
    (id: string, event: React.PointerEvent) => {
      if (!surfaceRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      surfaceRef.current.setPointerCapture(event.pointerId);
      dragRef.current = { id, pointerId: event.pointerId, moved: false };
      setDraggingId(id);
      // Select immediately on press; suppress the following surface click
      // so pointer-capture doesn't clear the selection.
      suppressClickRef.current = true;
      onSelect(id);
    },
    [onSelect]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag && surfaceRef.current && event.pointerId === drag.pointerId) {
        drag.moved = true;
        onMove(drag.id, pointFromEvent(event, surfaceRef.current));
        return;
      }

      const pan = panRef.current;
      const vp = viewportRef.current;
      if (pan && vp && event.pointerId === pan.pointerId) {
        const dx = event.clientX - pan.startX;
        const dy = event.clientY - pan.startY;
        if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true;
        vp.scrollLeft = pan.scrollLeft - dx;
        vp.scrollTop = pan.scrollTop - dy;
      }
    },
    [onMove]
  );

  const endPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag && event.pointerId === drag.pointerId) {
        // Always suppress the synthetic click after a pin press/drag.
        suppressClickRef.current = true;
        dragRef.current = null;
        setDraggingId(null);
        if (surfaceRef.current?.hasPointerCapture(event.pointerId)) {
          surfaceRef.current.releasePointerCapture(event.pointerId);
        }
      }

      const pan = panRef.current;
      const vp = viewportRef.current;
      if (pan && event.pointerId === pan.pointerId) {
        if (pan.moved) suppressClickRef.current = true;
        panRef.current = null;
        if (vp?.hasPointerCapture(event.pointerId)) {
          vp.releasePointerCapture(event.pointerId);
        }
      }
    },
    []
  );

  const handleViewportPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (placing) return;
      if ((event.target as HTMLElement).closest("[data-map-pin]")) return;
      const vp = viewportRef.current;
      if (!vp || !canPan) return;
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: vp.scrollLeft,
        scrollTop: vp.scrollTop,
        moved: false,
      };
      vp.setPointerCapture(event.pointerId);
    },
    [canPan, placing]
  );

  const zoomLabel = zoomToPercent(zoom);
  const hint = placing
    ? "Click the map to drop a pin"
    : canPan
      ? `Zoom ${zoomLabel}% · press a pin to select · drag map to pan`
      : `Zoom ${zoomLabel}% · press a pin to select`;

  // Fit size is capped to the map view; zoomed content scrolls inside that view.
  const viewH = viewport.height;
  const viewW = viewport.width;
  const mapW = scaledW > 0 ? scaledW : undefined;
  const mapH = scaledH > 0 ? scaledH : undefined;

  return (
    <div className="relative flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-white/5 bg-black/40">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-md border border-white/10 bg-black/70 p-1 backdrop-blur-sm">
          <ZoomButton
            label="Zoom out"
            onClick={() => applyZoom(zoom - MAP_ZOOM_STEP)}
            disabled={zoom <= MAP_ZOOM_MIN}
          >
            −
          </ZoomButton>
          <button
            type="button"
            onClick={() => applyZoom(1)}
            className="min-w-[3.75rem] rounded px-1.5 py-1 text-[11px] font-semibold tabular-nums text-[var(--gold)] transition hover:bg-white/10"
            title="Reset to 0% (map view height)"
          >
            {zoomToPercent(zoom)}%
          </button>
          <ZoomButton
            label="Zoom in"
            onClick={() => applyZoom(zoom + MAP_ZOOM_STEP)}
            disabled={zoom >= MAP_ZOOM_MAX}
          >
            +
          </ZoomButton>
        </div>

        {/* Absolute fill keeps this viewport's height = map view height only */}
        <div
          ref={viewportRef}
          className="absolute inset-0 overflow-auto overscroll-contain"
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: Math.max(scaledW, viewW || 0),
              height: Math.max(scaledH, viewH || 0),
            }}
          >
            <div
              ref={surfaceRef}
              role="application"
              aria-label="Story map editor canvas"
              data-map-surface
              className={`relative overflow-hidden rounded-md bg-[#111] shadow-[inset_0_0_40px_rgba(0,0,0,0.45)] ${
                placing
                  ? "cursor-crosshair"
                  : draggingId
                    ? "cursor-grabbing"
                    : canPan
                      ? "cursor-grab"
                      : "cursor-default"
              }`}
              style={{
                width: mapW ?? "100%",
                height: mapH ?? "100%",
              }}
              onClick={handleSurfaceClick}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STORY_MAP_IMAGE}
                alt="Ramayana story map"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-bottom select-none"
                draggable={false}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#111]/70 via-transparent to-[#111]/25"
                aria-hidden
              />

              {scaledW > 0 ? (
                <JourneyPath markers={markers} pathIds={pathIds} />
              ) : null}

              {markers.map((marker) => (
                <div key={marker.id} data-map-pin>
                  <MapMarkerPin
                    marker={marker}
                    selected={marker.id === selectedId}
                    showLabel={marker.id === selectedId}
                    pathIndex={pathIndexById.get(marker.id) ?? null}
                    onSelect={handleMarkerSelect}
                    onDragStart={handleDragStart}
                  />
                </div>
              ))}

            {placing && scaledW > 0 && (
              <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-lg bg-black/55 px-4 py-3 text-center backdrop-blur-sm">
                <p className="text-sm font-medium text-white">
                  Click the map to place a pin
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  It won’t be saved until you press Save
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/5 px-3 py-2 text-xs text-[#f2c675] sm:px-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-6"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #F2C675 0 5px, transparent 5px 12px)",
              }}
              aria-hidden
            />
            Rama’s journey
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#FFAD16] shadow-[0_0_0_3px_rgba(255,173,22,0.28)]" />
            Places & landmarks
          </span>
        </div>
        <p className="truncate text-[var(--text-muted)]">{hint}</p>
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded text-base font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
