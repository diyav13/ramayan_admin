"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapMarkerInspector } from "@/components/map/MapMarkerInspector";
import { MapMarkersList } from "@/components/map/MapMarkersList";
import { StoryMapCanvas } from "@/components/map/StoryMapCanvas";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { FlowGuide } from "@/components/ui/FlowGuide";
import { getErrorMessage } from "@/lib/api/errors";
import {
  loadCharactersCatalog,
  loadEventsCatalog,
  loadLocationsCatalog,
} from "@/lib/catalog/options";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  clampPercent,
  createMarkerId,
  loadStoryMap,
  saveStoryMap,
  toPersistableStoryMap,
} from "@/lib/map/placements";
import { isBlankHtml } from "@/lib/utils";
import { storyMapService } from "@/services/story-map";
import type { Character } from "@/types/character";
import type { Event as StoryEvent } from "@/types/event";
import type { Location } from "@/types/location";
import type {
  MapMarker,
  MapMarkerDraft,
  MapPoint,
  MapTool,
  StoryMapDocument,
} from "@/types/map-marker";

function storyMapFingerprint(doc: StoryMapDocument): string {
  return JSON.stringify(toPersistableStoryMap(doc));
}

function mergeById<T extends { id: string }>(items: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of items) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

function toDraft(marker: MapMarker): MapMarkerDraft {
  return {
    locationId: marker.locationId,
    name: marker.name,
    subtitle: marker.subtitle,
    description: marker.description,
    bodyHtml: marker.bodyHtml,
    characterIds: marker.characterIds,
    eventIds: marker.eventIds,
    kind: marker.kind,
    imageUrl: marker.imageUrl,
    detailImageUrl: marker.detailImageUrl,
    xPercent: marker.xPercent,
    yPercent: marker.yPercent,
  };
}

function emptyDraft(point: MapPoint): MapMarkerDraft {
  return {
    locationId: null,
    name: "",
    subtitle: "",
    description: "",
    bodyHtml: "",
    characterIds: [],
    eventIds: [],
    kind: "place",
    imageUrl: null,
    detailImageUrl: null,
    xPercent: point.xPercent,
    yPercent: point.yPercent,
  };
}

export function StoryMapEditor() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MapMarkerDraft | null>(null);
  const [tool, setTool] = useState<MapTool>("place");
  /** True while waiting for a map click to drop a new pin. */
  const [placing, setPlacing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [listSearch, setListSearch] = useState("");
  const debouncedListSearch = useDebouncedValue(listSearch);
  const [searchedMarkerIds, setSearchedMarkerIds] = useState<string[] | null>(
    null
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRequestId = useRef(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [allEvents, setAllEvents] = useState<StoryEvent[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(
    "Select a pin on the map, or press Add pin to place a new one."
  );
  /** Last doc successfully loaded/synced — skips GET→immediate PUT and no-op edits. */
  const lastSyncedFingerprint = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const doc = await storyMapService.get();
        if (cancelled) return;
        const markersFromApi = Array.isArray(doc.markers) ? doc.markers : [];
        const pathFromApi = Array.isArray(doc.pathIds) ? doc.pathIds : [];
        const merged = markersFromApi.map((marker) => ({
          ...marker,
          imageUrl: marker.imageUrl ?? null,
          detailImageUrl: marker.detailImageUrl ?? null,
        }));
        const persistable = toPersistableStoryMap({
          version: 2,
          markers: merged,
          pathIds: pathFromApi,
        });
        lastSyncedFingerprint.current = storyMapFingerprint(persistable);
        setMarkers(merged);
        setPathIds(pathFromApi);
        saveStoryMap(persistable);
      } catch {
        if (cancelled) return;
        const local = loadStoryMap();
        // Force one sync attempt for the local draft after a failed GET.
        lastSyncedFingerprint.current = null;
        setMarkers(local.markers);
        setPathIds(local.pathIds);
        setHint(
          "Could not load Story Map from server — showing local draft. Saves will retry to the API."
        );
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const doc = { version: 2 as const, markers, pathIds };
    const persistable = toPersistableStoryMap(doc);
    saveStoryMap(persistable);

    const fingerprint = storyMapFingerprint(persistable);
    if (fingerprint === lastSyncedFingerprint.current) return;

    const handle = window.setTimeout(() => {
      void storyMapService
        .save(persistable)
        .then(() => {
          lastSyncedFingerprint.current = fingerprint;
        })
        .catch(() => {
          setHint(
            "Pin changes are cached locally but failed to sync to the server. Check your connection and try again."
          );
        });
    }, 400);

    return () => window.clearTimeout(handle);
  }, [hydrated, markers, pathIds]);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      try {
        const [locationData, characterData, eventData] = await Promise.all([
          loadLocationsCatalog(),
          loadCharactersCatalog(),
          loadEventsCatalog(),
        ]);
        if (!cancelled) {
          setLocations(locationData);
          setAllCharacters(characterData);
          setAllEvents(eventData);
          setCharacters(characterData);
          setEvents(eventData);
          setCatalogError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCatalogError(
            getErrorMessage(
              err,
              "Failed to load locations, characters, or events"
            )
          );
        }
      }
    }
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const draftRef = useRef(draft);
  draftRef.current = draft;

  // When a catalog location is linked, load its characters/events from the API.
  // If none are linked yet, keep showing the full catalogs.
  useEffect(() => {
    const locationId = draft?.locationId ?? null;
    if (!locationId) {
      setCharacters(allCharacters);
      setEvents(allEvents);
      return;
    }

    let cancelled = false;
    async function loadForLocation() {
      try {
        const [characterData, eventData] = await Promise.all([
          loadCharactersCatalog(locationId),
          loadEventsCatalog(locationId),
        ]);
        if (cancelled) return;

        const selectedCharacterIds = new Set(
          draftRef.current?.characterIds ?? []
        );
        const selectedEventIds = new Set(draftRef.current?.eventIds ?? []);

        const nextCharacters =
          characterData.length > 0
            ? mergeById([
                ...characterData,
                ...allCharacters.filter((character) =>
                  selectedCharacterIds.has(character.id)
                ),
              ])
            : allCharacters;
        const nextEvents =
          eventData.length > 0
            ? mergeById([
                ...eventData,
                ...allEvents.filter((event) => selectedEventIds.has(event.id)),
              ])
            : allEvents;

        setCharacters(nextCharacters);
        setEvents(nextEvents);
      } catch {
        if (!cancelled) {
          setCharacters(allCharacters);
          setEvents(allEvents);
        }
      }
    }

    void loadForLocation();
    return () => {
      cancelled = true;
    };
  }, [allCharacters, allEvents, draft?.locationId]);

  // Pin list search via BE (no pagination). Full `markers` stay for the canvas.
  const markersRef = useRef(markers);
  markersRef.current = markers;

  useEffect(() => {
    if (!hydrated) return;

    const term = debouncedListSearch.trim();
    if (!term) {
      searchRequestId.current += 1;
      setSearchedMarkerIds(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const requestId = ++searchRequestId.current;
    setSearchLoading(true);

    async function runSearch() {
      try {
        const doc = await storyMapService.get({ search: term });
        if (cancelled || requestId !== searchRequestId.current) return;
        const ids = Array.isArray(doc.markers)
          ? doc.markers.map((marker) => marker.id)
          : [];
        setSearchedMarkerIds(ids);
      } catch {
        if (cancelled || requestId !== searchRequestId.current) return;
        // Fallback: local filter if the search request fails.
        const q = term.toLowerCase();
        setSearchedMarkerIds(
          markersRef.current
            .filter(
              (marker) =>
                marker.name.toLowerCase().includes(q) ||
                marker.subtitle.toLowerCase().includes(q) ||
                marker.description.toLowerCase().includes(q)
            )
            .map((marker) => marker.id)
        );
      } finally {
        if (!cancelled && requestId === searchRequestId.current) {
          setSearchLoading(false);
        }
      }
    }

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [hydrated, debouncedListSearch]);

  const selected = useMemo(
    () => markers.find((m) => m.id === selectedId) ?? null,
    [markers, selectedId]
  );

  const isNewUnsaved = Boolean(selected && !selected.saved);

  const pathIndex = useMemo(() => {
    if (!selectedId) return null;
    const index = pathIds.indexOf(selectedId);
    return index >= 0 ? index : null;
  }, [pathIds, selectedId]);

  /** Map shows live draft position/details for the selected pin. */
  const displayMarkers = useMemo(() => {
    if (!selectedId || !draft) return markers;
    return markers.map((marker) =>
      marker.id === selectedId
        ? {
            ...marker,
            locationId: draft.locationId,
            name: draft.name,
            subtitle: draft.subtitle,
            description: draft.description,
            bodyHtml: draft.bodyHtml,
            characterIds: draft.characterIds,
            eventIds: draft.eventIds,
            kind: draft.kind,
            imageUrl: draft.imageUrl,
            detailImageUrl: draft.detailImageUrl,
            xPercent: draft.xPercent,
            yPercent: draft.yPercent,
          }
        : marker
    );
  }, [draft, markers, selectedId]);

  const discardUnsaved = useCallback(() => {
    setMarkers((prev) => prev.filter((marker) => marker.saved));
    setSelectedId(null);
    setDraft(null);
  }, []);

  const selectMarker = useCallback(
    (id: string | null) => {
      setPlacing(false);

      if (!id) {
        if (selectedId) {
          setMarkers((prev) =>
            prev.some((m) => m.id === selectedId && !m.saved)
              ? prev.filter((m) => m.id !== selectedId)
              : prev
          );
        }
        setSelectedId(null);
        setDraft(null);
        return;
      }

      if (id === selectedId) {
        setHint(null);
        return;
      }

      const marker = markers.find((item) => item.id === id);
      if (!marker) return;

      if (selectedId) {
        setMarkers((prev) =>
          prev.some((m) => m.id === selectedId && !m.saved)
            ? prev.filter((m) => m.id !== selectedId)
            : prev
        );
      }

      setSelectedId(id);
      setDraft(toDraft(marker));
      setHint(null);
    },
    [markers, selectedId]
  );

  const startAddLocation = useCallback(() => {
    setMarkers((prev) => prev.filter((marker) => marker.saved));
    setSelectedId(null);
    setDraft(null);
    setTool("place");
    setPlacing(true);
    setHint("Step 1: click the map to drop a pin. Then fill details and Save.");
  }, []);

  const handlePlace = useCallback((point: MapPoint) => {
    const id = createMarkerId();
    const marker: MapMarker = {
      id,
      locationId: null,
      name: "",
      subtitle: "",
      description: "",
      bodyHtml: "",
      characterIds: [],
      eventIds: [],
      kind: "place",
      imageUrl: null,
      detailImageUrl: null,
      saved: false,
      xPercent: point.xPercent,
      yPercent: point.yPercent,
      updatedAt: new Date().toISOString(),
    };
    setMarkers((prev) => [...prev.filter((item) => item.saved), marker]);
    setSelectedId(id);
    setDraft(emptyDraft(point));
    setPlacing(false);
    setTool("place");
    setHint(
      "Step 2: fill pin details on the right, then press Save. Unsaved pins are discarded if you leave."
    );
  }, []);

  const handleMove = useCallback(
    (id: string, point: MapPoint) => {
      setDraft((prev) =>
        prev && selectedId === id
          ? { ...prev, xPercent: point.xPercent, yPercent: point.yPercent }
          : prev
      );
      setMarkers((prev) =>
        prev.map((marker) =>
          marker.id === id
            ? {
                ...marker,
                xPercent: point.xPercent,
                yPercent: point.yPercent,
                updatedAt: new Date().toISOString(),
              }
            : marker
        )
      );
    },
    [selectedId]
  );

  const handleSave = useCallback(() => {
    if (!selectedId || !draft) return;
    const name = draft.name.trim();
    const subtitle = draft.subtitle.trim();
    const description = draft.description.trim();
    const bodyHtml = draft.bodyHtml.trim();
    if (!name) {
      setHint("Name is required before saving.");
      return;
    }
    if (!subtitle) {
      setHint("Subtitle is required before saving.");
      return;
    }
    if (!description) {
      setHint("Short description is required before saving.");
      return;
    }
    if (isBlankHtml(bodyHtml)) {
      setHint("Role in the story is required before saving.");
      return;
    }

    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === selectedId
          ? {
              ...marker,
              locationId: draft.locationId,
              name,
              subtitle,
              description,
              bodyHtml,
              characterIds: draft.characterIds,
              eventIds: draft.eventIds,
              kind: draft.kind,
              imageUrl: draft.imageUrl,
              detailImageUrl: draft.detailImageUrl,
              xPercent: clampPercent(draft.xPercent),
              yPercent: clampPercent(draft.yPercent),
              saved: true,
              updatedAt: new Date().toISOString(),
            }
          : marker
      )
    );
    setDraft({
      ...draft,
      name,
      subtitle: draft.subtitle.trim(),
      description: draft.description.trim(),
      bodyHtml: draft.bodyHtml.trim(),
      xPercent: clampPercent(draft.xPercent),
      yPercent: clampPercent(draft.yPercent),
    });
    setPlacing(false);
    setHint("Pin saved. Optional: switch to Path to add it to Rama’s journey.");
  }, [draft, selectedId]);

  const handleRemove = useCallback(() => {
    if (!selectedId) return;
    const current = markers.find((m) => m.id === selectedId);
    setMarkers((prev) => prev.filter((marker) => marker.id !== selectedId));
    setPathIds((prev) => prev.filter((id) => id !== selectedId));
    setSelectedId(null);
    setDraft(null);
    setPlacing(false);
    setHint(current?.saved ? "Pin removed." : "New pin discarded.");
  }, [markers, selectedId]);

  const handlePathToggle = useCallback(
    (id: string) => {
      const marker = markers.find((item) => item.id === id);
      if (!marker?.saved) {
        setHint("Save the pin before adding it to the path.");
        return;
      }
      setPathIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((item) => item !== id);
        }
        return [...prev, id];
      });
      setHint("Path updated — numbered stops show journey order.");
    },
    [markers]
  );

  const handleReorderPath = useCallback((fromIndex: number, toIndex: number) => {
    setPathIds((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  }, []);

  const setToolAndHint = useCallback(
    (next: MapTool) => {
      setMarkers((prev) => prev.filter((marker) => marker.saved));
      if (selectedId) {
        const current = markers.find((m) => m.id === selectedId);
        if (current && !current.saved) {
          setSelectedId(null);
          setDraft(null);
        }
      }
      setPlacing(false);
      setTool(next);
      if (next === "path") {
        setHint(
          "Path mode: add saved pins in order from the list. Drag to reorder."
        );
      } else {
        setHint(
          "Place mode: select a pin on the map, or press Add pin to place a new one."
        );
      }
    },
    [markers, selectedId]
  );

  const savedMarkers = useMemo(
    () => markers.filter((marker) => marker.saved),
    [markers]
  );

  const listMarkers = useMemo(() => {
    // Path tab always needs the full pin set; search only filters the Pins list.
    if (tool === "path" || searchedMarkerIds === null) return savedMarkers;
    const allowed = new Set(searchedMarkerIds);
    return savedMarkers.filter((marker) => allowed.has(marker.id));
  }, [savedMarkers, searchedMarkerIds, tool]);

  const isSearching =
    listSearch.trim() !== debouncedListSearch.trim() || searchLoading;

  const listProps = {
    markers: listMarkers,
    pathIds,
    selectedId: selected?.saved ? selectedId : null,
    search: listSearch,
    searchLoading: isSearching,
    tool,
    onToolChange: setToolAndHint,
    onSearchChange: setListSearch,
    onSelect: selectMarker,
    onReorderPath: handleReorderPath,
    onRemoveFromPath: (id: string) =>
      setPathIds((prev) => prev.filter((item) => item !== id)),
    onClearPath: () => setPathIds([]),
    onAddToPath: handlePathToggle,
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden sm:gap-3">
      <div className="shrink-0 space-y-2">
        <PageHeader
          title="Story Map"
          subtitle="Place pins on the map, fill their details, then optionally build the journey path."
        />

        <FlowGuide
          compact
          title="Flow"
          steps={[
            "Add pin & click the map",
            "Fill details & Save",
            "Optional: Path tab for journey order",
          ]}
          footer="Catalog locations can be linked on multiple pins. Choosing a location fills and filters its characters and events (or shows all if none are linked yet)."
        />

        {catalogError ? <ErrorBanner message={catalogError} /> : null}
        {hint ? (
          <p
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-muted)] sm:text-sm"
            role="status"
          >
            {hint}
          </p>
        ) : null}
      </div>

      {/*
        Map column is width-capped (comfortable for pins) so sidebar collapse
        grows the form, not the map. List | Map | Form (flexible)
      */}
      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,32rem)_minmax(24rem,1fr)] xl:grid-cols-[15.5rem_minmax(0,32rem)_minmax(24rem,1fr)]">
        <div className="hidden h-full min-h-0 overflow-hidden xl:block">
          <MapMarkersList {...listProps} />
        </div>

        <div className="h-full max-h-full min-h-0 overflow-hidden">
          <StoryMapCanvas
            markers={displayMarkers}
            pathIds={pathIds}
            selectedId={selectedId}
            placing={placing}
            zoom={zoom}
            onZoomChange={setZoom}
            onSelect={selectMarker}
            onPlace={handlePlace}
            onMove={handleMove}
          />
        </div>

        <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden xl:hidden">
            <MapMarkersList {...listProps} />
          </div>
          <div className="min-h-0 min-w-0 flex-[1.4] overflow-hidden">
            <MapMarkerInspector
              marker={selected}
              draft={draft}
              locations={locations}
              characters={characters}
              events={events}
              pathIndex={pathIndex}
              isNew={!selected?.saved}
              onChange={setDraft}
              onSave={handleSave}
              onRemove={handleRemove}
              onClearSelection={() => {
                if (isNewUnsaved) {
                  discardUnsaved();
                  setPlacing(false);
                  setHint("New pin discarded.");
                } else {
                  selectMarker(null);
                }
              }}
              onAddLocation={startAddLocation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

