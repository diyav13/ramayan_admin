"use client";

import { StoryMapEditor } from "@/components/map/StoryMapEditor";

/**
 * Fill the dashboard main column so the page itself does not scroll —
 * zoom/pan happen inside the map panel.
 */
export default function StoryMapPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StoryMapEditor />
    </div>
  );
}
