"use client";

export type InformationTab = "characters" | "locations" | "quizInstructions";

const tabs: { id: InformationTab; label: string }[] = [
  { id: "characters", label: "Characters" },
  { id: "locations", label: "Locations" },
  { id: "quizInstructions", label: "Quiz Instructions" },
];

type InfoEntityTabsProps = {
  active: InformationTab;
  onChange: (tab: InformationTab) => void;
  disabled?: boolean;
};

export function InfoEntityTabs({
  active,
  onChange,
  disabled = false,
}: InfoEntityTabsProps) {
  return (
    <div className="w-full min-w-0">
      <div
        role="tablist"
        aria-label="Information type"
        className="inline-flex max-w-full overflow-x-auto rounded-lg border border-white/10 bg-[var(--surface)] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm tracking-wide transition sm:px-4 sm:py-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? "bg-[var(--gold)]/20 font-semibold text-[var(--gold)]"
                  : "font-medium text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
