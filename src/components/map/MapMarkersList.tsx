"use client";

import { useState, type DragEvent } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import type { MapMarker, MapTool } from "@/types/map-marker";

type MapMarkersListProps = {
  markers: MapMarker[];
  pathIds: string[];
  selectedId: string | null;
  search: string;
  /** Spinner at the end of the search field while API search is in flight. */
  searchLoading?: boolean;
  tool: MapTool;
  onToolChange: (tool: MapTool) => void;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onReorderPath: (fromIndex: number, toIndex: number) => void;
  onRemoveFromPath: (id: string) => void;
  onClearPath: () => void;
  onAddToPath: (id: string) => void;
};

export function MapMarkersList({
  markers,
  pathIds,
  selectedId,
  search,
  searchLoading = false,
  tool,
  onToolChange,
  onSearchChange,
  onSelect,
  onReorderPath,
  onRemoveFromPath,
  onClearPath,
  onAddToPath,
}: MapMarkersListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const byId = new Map(markers.map((m) => [m.id, m]));
  const pathMarkers = pathIds
    .map((id) => byId.get(id))
    .filter((m): m is MapMarker => Boolean(m));

  const notOnPath = markers.filter((marker) => !pathIds.includes(marker.id));

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  }

  function handleDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (dragIndex !== null) {
      onReorderPath(dragIndex, index);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
      <div className="border-b border-white/5 p-2">
        <div className="grid w-full grid-cols-2 gap-1 rounded-md bg-black/25 p-1">
          <PanelTab
            active={tool === "place"}
            onClick={() => onToolChange("place")}
            label={`Pins (${markers.length})`}
          />
          <PanelTab
            active={tool === "path"}
            onClick={() => onToolChange("path")}
            label={`Path (${pathIds.length})`}
          />
        </div>
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-[var(--text-muted)]">
          {tool === "place"
            ? "Saved pins on the map. Select one to edit."
            : "Journey order — add saved pins, then drag to reorder."}
        </p>
        {tool === "path" && pathIds.length > 0 ? (
          <div className="mt-1.5 flex justify-end px-1">
            <button
              type="button"
              onClick={onClearPath}
              className="text-[11px] font-medium text-[var(--text-muted)] transition hover:text-white"
            >
              Clear path
            </button>
          </div>
        ) : null}
      </div>

      {tool === "place" ? (
        <>
          <div className="border-b border-white/5 px-3 py-2.5">
            <SearchInput
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onClear={() => onSearchChange("")}
              placeholder="Search pins by name or subtitle…"
              loading={searchLoading}
            />
          </div>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
            {markers.length === 0 ? (
              <Empty
                text={
                  search.trim()
                    ? "No pins match your search."
                    : "No pins yet — press Add pin and click the map."
                }
              />
            ) : (
              markers.map((marker) => (
                <MarkerRow
                  key={marker.id}
                  marker={marker}
                  active={marker.id === selectedId}
                  badge={
                    pathIds.includes(marker.id)
                      ? String(pathIds.indexOf(marker.id) + 1)
                      : null
                  }
                  onSelect={onSelect}
                  onAddToPath={
                    pathIds.includes(marker.id)
                      ? undefined
                      : () => onAddToPath(marker.id)
                  }
                />
              ))
            )}
          </ul>
        </>
      ) : (
        <>
          <div className="border-b border-white/5 px-3 py-2">
            <p className="text-[11px] text-[var(--text-muted)]">
              Drag stops to reorder · tap a name to edit
            </p>
          </div>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
            {pathMarkers.length === 0 ? (
              <Empty text="No stops yet. Add places from the list below." />
            ) : (
              pathMarkers.map((marker, index) => {
                const isDragging = dragIndex === index;
                const isOver = overIndex === index && dragIndex !== index;

                return (
                  <li
                    key={marker.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(event) => handleDragOver(event, index)}
                    onDrop={(event) => handleDrop(event, index)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-grab active:cursor-grabbing ${
                      isDragging ? "opacity-45" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                        isOver
                          ? "bg-[var(--gold)]/10 ring-1 ring-[var(--gold)]/50"
                          : marker.id === selectedId
                            ? "bg-[var(--gold)]/15 ring-1 ring-[var(--gold)]/35"
                            : "hover:bg-white/5"
                      }`}
                    >
                      <span
                        className="flex size-5 shrink-0 items-center justify-center text-[var(--text-muted)]"
                        aria-hidden
                        title="Drag to reorder"
                      >
                        <DragHandleIcon />
                      </span>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-[10px] font-bold leading-none tabular-nums text-black">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelect(marker.id)}
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-white"
                        title="Edit this place"
                      >
                        {marker.name || "Untitled"}
                      </button>
                      <TinyIconButton
                        label="Remove from path"
                        onClick={() => onRemoveFromPath(marker.id)}
                      >
                        ×
                      </TinyIconButton>
                    </div>
                  </li>
                );
              })
            )}

            {notOnPath.length > 0 ? (
              <li className="pt-3">
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Add to path
                </p>
                <ul className="space-y-0.5">
                  {notOnPath.map((marker) => (
                    <li key={marker.id}>
                      <button
                        type="button"
                        onClick={() => onAddToPath(marker.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/5"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-white/20 text-[10px] text-[var(--text-muted)]">
                          +
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-muted)] hover:text-white">
                          {marker.name || "Untitled"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ) : null}
          </ul>
        </>
      )}
    </div>
  );
}

function MarkerRow({
  marker,
  active,
  badge,
  onSelect,
  onAddToPath,
}: {
  marker: MapMarker;
  active: boolean;
  badge: string | null;
  onSelect: (id: string) => void;
  onAddToPath?: () => void;
}) {
  return (
    <li>
      <div
        className={`flex w-full items-center gap-1 rounded-md transition ${
          active
            ? "bg-[var(--gold)]/18 ring-2 ring-[var(--gold)]/55"
            : "hover:bg-white/5"
        }`}
      >
        <button
          type="button"
          onClick={() => onSelect(marker.id)}
          className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left"
        >
          <span className="relative flex size-7 shrink-0 items-center justify-center">
            <span className="flex size-full items-center justify-center overflow-hidden rounded-md bg-black/30">
              {marker.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={marker.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : marker.kind === "journey" ? (
                <span className="size-2 rounded-full bg-[var(--gold)]" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/map/gold-pin.svg" alt="" className="size-[18px]" />
              )}
            </span>
            {badge ? (
              <span className="absolute -right-1.5 -top-1.5 z-10 flex size-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold)] px-0.5 text-[9px] font-bold leading-none tabular-nums text-black shadow-sm">
                {badge}
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">
              {marker.name || "Untitled"}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-[var(--text-muted)]">
              {marker.subtitle ||
                `${marker.xPercent.toFixed(0)}%, ${marker.yPercent.toFixed(0)}%`}
            </span>
          </span>
        </button>
        {onAddToPath ? (
          <TinyIconButton label="Add to path" onClick={onAddToPath}>
            +
          </TinyIconButton>
        ) : null}
      </div>
    </li>
  );
}

function PanelTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded px-2 py-1.5 text-center text-[11px] font-semibold tracking-wide transition ${
        active
          ? "bg-[var(--gold)] text-black"
          : "text-[var(--text-muted)] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <li className="px-2 py-6 text-center text-xs text-[var(--text-muted)]">
      {text}
    </li>
  );
}

function TinyIconButton({
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
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="mr-1 flex size-6 shrink-0 items-center justify-center rounded text-xs text-[var(--text-muted)] transition hover:bg-white/10 hover:text-white disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function DragHandleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}
