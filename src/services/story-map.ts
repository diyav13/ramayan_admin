import { api } from "@/lib/api";
import { createInflightDedupe } from "@/lib/api/inflight";
import { paths } from "@/lib/api/paths";
import { buildQuery } from "@/lib/api/query";
import { toPersistableStoryMap } from "@/lib/map/placements";
import type { StoryMapDocument } from "@/types/map-marker";

type StoryMapApiDocument = StoryMapDocument & {
  id?: string;
  updatedAt?: string;
};

type StoryMapGetParams = {
  /** Filters pins by name / subtitle / description. No pagination. */
  search?: string;
};

const fetchStoryMapOnce = createInflightDedupe<StoryMapApiDocument>();

function storyMapGetKey(params: StoryMapGetParams): string {
  return `admin:${params.search?.trim() || ""}`;
}

export const storyMapService = {
  /** Full markers for the admin editor (includes S3 pin + detail image URLs). */
  get: (params: StoryMapGetParams = {}) =>
    fetchStoryMapOnce(
      () =>
        api.get<StoryMapApiDocument>(
          `${paths.storyMap.root}${buildQuery({
            view: "admin",
            search: params.search?.trim() || undefined,
          })}`
        ),
      storyMapGetKey(params)
    ),

  save: (doc: StoryMapDocument) => {
    const cleaned = toPersistableStoryMap(doc);
    return api.put<StoryMapApiDocument>(paths.storyMap.root, {
      version: 2,
      markers: cleaned.markers.map((marker) => ({
        ...marker,
        imageUrl: marker.imageUrl || null,
        detailImageUrl: marker.detailImageUrl || null,
      })),
      pathIds: cleaned.pathIds,
    });
  },
};
