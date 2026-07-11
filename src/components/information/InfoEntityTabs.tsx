"use client";

export type InformationTab = "characters" | "locations";

const tabs: { id: InformationTab; label: string }[] = [
  { id: "characters", label: "Characters" },
  { id: "locations", label: "Locations" },
];

type InfoEntityTabsProps = {
  active: InformationTab;
  onChange: (tab: InformationTab) => void;
};

export function InfoEntityTabs({ active, onChange }: InfoEntityTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Information type"
      className="inline-flex rounded-lg border border-white/10 bg-[var(--surface)] p-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`rounded-md px-4 py-2 text-sm transition ${
              isActive
                ? "bg-[var(--gold)]/20 font-semibold text-[var(--gold)]"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
