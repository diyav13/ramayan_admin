// Episode model + dummy data for the admin episode-management screen.
// Based on the `episodes` table schema. Each episode belongs to a chapter
// via chapter_id. The accent color is inherited from that chapter.

export type Episode = {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  orderIndex: number;
  durationSeconds: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Format seconds as m:ss for display. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const initialEpisodes: Episode[] = [
  {
    id: "ep_4001",
    chapterId: "ch_3001",
    title: "Setting the Scene",
    description: "An introduction to the world of the Ramayana.",
    thumbnailUrl: "",
    videoUrl: "",
    orderIndex: 1,
    durationSeconds: 420,
    isPublished: true,
    createdAt: "2026-01-06",
    updatedAt: "2026-01-06",
  },
  {
    id: "ep_4002",
    chapterId: "ch_3001",
    title: "Birth of the Four Brothers",
    description: "Rama, Lakshmana, Bharata and Shatrughna are born.",
    thumbnailUrl: "",
    videoUrl: "",
    orderIndex: 2,
    durationSeconds: 510,
    isPublished: true,
    createdAt: "2026-01-08",
    updatedAt: "2026-02-01",
  },
  {
    id: "ep_4003",
    chapterId: "ch_3002",
    title: "The Promise",
    description: "Kaikeyi calls in the two boons promised by Dasharatha.",
    thumbnailUrl: "",
    videoUrl: "",
    orderIndex: 1,
    durationSeconds: 360,
    isPublished: false,
    createdAt: "2026-02-15",
    updatedAt: "2026-02-15",
  },
];
