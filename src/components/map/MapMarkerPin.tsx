"use client";

import type { MapMarker } from "@/types/map-marker";

type MapMarkerPinProps = {
  marker: MapMarker;
  selected: boolean;
  showLabel: boolean;
  pathIndex: number | null;
  onSelect: (id: string) => void;
  onDragStart: (id: string, event: React.PointerEvent) => void;
};

export function MapMarkerPin({
  marker,
  selected,
  showLabel,
  pathIndex,
  onSelect,
  onDragStart,
}: MapMarkerPinProps) {
  const isJourney = marker.kind === "journey";
  const hasImage = Boolean(marker.imageUrl);

  return (
    <button
      type="button"
      aria-label={`${marker.name || "Untitled place"} at ${marker.xPercent.toFixed(1)}%, ${marker.yPercent.toFixed(1)}%`}
      aria-pressed={selected}
      className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 touch-none outline-none ${
        selected ? "z-20" : ""
      }`}
      style={{ left: `${marker.xPercent}%`, top: `${marker.yPercent}%` }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(marker.id);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onDragStart(marker.id, event);
      }}
    >
      <span
        className={`relative flex flex-col items-center transition duration-150 ${
          selected ? "scale-105" : "group-hover:scale-105"
        }`}
      >
        {hasImage ? (
          <span className="relative mb-[-2px]">
            {selected ? (
              <span
                className="pointer-events-none absolute -inset-0.5 rounded-lg bg-[var(--gold)]/25 blur-[2px]"
                aria-hidden
              />
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={marker.imageUrl!}
              alt=""
              className={`pointer-events-none relative h-7 w-7 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)] sm:h-8 sm:w-8 ${
                selected
                  ? "rounded-md ring-2 ring-[var(--gold)] ring-offset-1 ring-offset-black/40"
                  : ""
              }`}
              draggable={false}
            />
          </span>
        ) : null}

        <span className="relative flex items-center justify-center">
          {selected ? (
            <span
              className="pointer-events-none absolute size-6 rounded-full bg-[var(--gold)]/20 blur-[1px]"
              aria-hidden
            />
          ) : null}

          {isJourney && !hasImage ? (
            <span
              className={`relative size-2 rounded-full bg-[var(--gold)] shadow-[0_0_0_2px_rgba(231,160,32,0.28)] ${
                selected
                  ? "shadow-[0_0_0_3px_rgba(231,160,32,0.45),0_0_8px_rgba(231,160,32,0.55)]"
                  : pathIndex !== null
                    ? "ring ring-white/70"
                    : ""
              }`}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/map/gold-pin.svg"
              alt=""
              width={hasImage ? 18 : 26}
              height={hasImage ? 18 : 26}
              className={`pointer-events-none relative drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] ${
                hasImage ? "size-[18px]" : "size-[26px]"
              } ${selected ? "brightness-125" : ""}`}
              draggable={false}
            />
          )}

          {selected && !hasImage ? (
            <span
              className="pointer-events-none absolute size-8 rounded-full ring-2 ring-[var(--gold)]/80 ring-offset-1 ring-offset-transparent"
              aria-hidden
            />
          ) : null}
        </span>

        {pathIndex !== null ? (
          <span className="absolute -right-1.5 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[var(--gold)] text-[8px] font-bold leading-none text-black shadow sm:size-4 sm:text-[9px]">
            {pathIndex + 1}
          </span>
        ) : null}
      </span>

      {showLabel && marker.name ? (
        <span
          className={`pointer-events-none absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 overflow-hidden whitespace-nowrap rounded-full text-left ${
            isJourney
              ? "flex h-[22px] items-center px-2.5"
              : "flex min-h-[36px] flex-col items-start justify-center px-3 py-1"
          } ${
            selected
              ? "bg-[rgba(33,35,36,0.45)] ring-1 ring-[var(--gold)]/35"
              : "bg-[rgba(33,35,36,0.3)]"
          }`}
        >
          {isJourney ? (
            <span className="text-[11px] font-medium leading-[1.15] text-white">
              {marker.name}
            </span>
          ) : (
            <span className="flex flex-col items-start leading-[1.15]">
              <span className="text-[13px] font-medium text-white">
                {marker.name}
              </span>
              {marker.subtitle ? (
                <span className="text-[10px] font-medium text-[#f2c675]">
                  {marker.subtitle}
                </span>
              ) : null}
            </span>
          )}
        </span>
      ) : null}
    </button>
  );
}
