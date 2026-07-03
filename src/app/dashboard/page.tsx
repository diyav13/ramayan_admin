const stats = [
  { label: "Total Users", value: "12,480" },
  { label: "Active Chapters", value: "7" },
  { label: "Episodes", value: "142" },
  { label: "Subscribers", value: "3,210" },
];

const chapters = [
  {
    id: 1,
    title: "Bala Kanda",
    subtitle: "The Beginning",
    episodes: 24,
    border: "#eb9f34",
    status: "Published",
  },
  {
    id: 2,
    title: "Ayodhya Kanda",
    subtitle: "The Exile",
    episodes: 18,
    border: "#e74c3c",
    status: "Published",
  },
  {
    id: 3,
    title: "Aranya Kanda",
    subtitle: "Forest Life",
    episodes: 16,
    border: "#54d73b",
    status: "Draft",
  },
  {
    id: 4,
    title: "Kishkindha Kanda",
    subtitle: "The Monkey Kingdom",
    episodes: 12,
    border: "#9b59b6",
    status: "Locked",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Welcome back. Here&apos;s what&apos;s happening with Ramayana.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
          Chapters
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {chapters.map((chapter) => (
            <ChapterCard key={chapter.id} {...chapter} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--gold-border)]/30 bg-[var(--surface-alt)] p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}

function ChapterCard({
  title,
  subtitle,
  episodes,
  border,
  status,
}: (typeof chapters)[0]) {
  return (
    <div
      className="overflow-hidden rounded-lg border bg-[var(--surface-dark)]"
      style={{ borderColor: border, borderBottomWidth: 3 }}
    >
      <div className="relative h-20 bg-gradient-to-br from-[#2a2018] to-[#0f0f0f]">
        <span className="absolute left-3 top-2 text-[9px] font-semibold uppercase tracking-wider">
          Chapter
        </span>
        {status === "Locked" && (
          <span className="absolute right-3 top-2 text-xs text-[var(--gold)]">
            🔒
          </span>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-serif text-base capitalize">{title}</h4>
        <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{episodes} episodes</span>
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
