// Chapter model + dummy data for the admin chapter-management screen.
// Based on the `chapters` table schema.

export type Chapter = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  accentColor: string;
  thumbnailUrl: string;
  orderIndex: number;
  isPublished: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
};

export const initialChapters: Chapter[] = [
  {
    id: "ch_3001",
    title: "Bala Kanda",
    tagline: "The Beginning",
    description: "The birth and early life of Rama in Ayodhya.",
    accentColor: "#eb9f34",
    thumbnailUrl: "",
    orderIndex: 1,
    isPublished: true,
    isPremium: false,
    createdAt: "2026-01-05",
    updatedAt: "2026-01-05",
  },
  {
    id: "ch_3002",
    title: "Ayodhya Kanda",
    tagline: "The Exile",
    description: "Rama's exile to the forest for fourteen years.",
    accentColor: "#e74c3c",
    thumbnailUrl: "",
    orderIndex: 2,
    isPublished: true,
    isPremium: true,
    createdAt: "2026-01-18",
    updatedAt: "2026-02-10",
  },
  {
    id: "ch_3003",
    title: "Aranya Kanda",
    tagline: "Forest Life",
    description: "Life in the forest and the abduction of Sita.",
    accentColor: "#54d73b",
    thumbnailUrl: "",
    orderIndex: 3,
    isPublished: false,
    isPremium: true,
    createdAt: "2026-02-02",
    updatedAt: "2026-02-02",
  },
  {
    id: "ch_3004",
    title: "Kishkindha Kanda",
    tagline: "The Monkey Kingdom",
    description: "The alliance with Sugriva and the vanara army.",
    accentColor: "#9b59b6",
    thumbnailUrl: "",
    orderIndex: 4,
    isPublished: false,
    isPremium: true,
    createdAt: "2026-02-20",
    updatedAt: "2026-03-01",
  },
];
