// Shared table shell: bordered surface + header row. Each page renders its own
// rows as children so the cell layout stays flexible per module.
// Uses table-fixed + full width so action columns stay visible without
// horizontal scrolling; long text should truncate inside cells.
//
// Width rules by field type (override per-column with `width` when needed):
// - index (#): compact numeric
// - identity (title/name/user/episode/chapter primary): fluid (no width)
// - status / plan / access: badge-sized
// - counts / dates: content-sized
// - actions: fits icon buttons (2 or 3)

type Breakpoint = "sm" | "md" | "lg";

type Column = {
  label: string;
  /** Shorter header text on the smallest screens (full label from `sm` up). */
  shortLabel?: string;
  align?: "left" | "right";
  /** CSS width for this column (e.g. "3rem", "22%"). */
  width?: string;
  /** Hide this column below the given breakpoint (pair with matching `td` classes). */
  hideBelow?: Breakpoint;
};

const HIDE_COL: Record<Breakpoint, string> = {
  sm: "hidden sm:table-column",
  md: "hidden md:table-column",
  lg: "hidden lg:table-column",
};

const HIDE_CELL: Record<Breakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

/** Default widths keyed by field type / column label. */
function defaultWidth(col: Column): string | undefined {
  if (col.width) return col.width;
  const label = col.label.toLowerCase();

  // Index / order
  if (label === "#" || label === "no") return "2.5rem";

  // Actions — room for icon buttons + padding (pages with 3 actions override)
  if (label === "actions") return "6.5rem";

  // Badges
  if (label === "status") return "6.5rem";
  if (label === "access" || label === "plan") return "5.75rem";

  // Compact metrics
  if (label === "episodes") return "5rem";
  if (label === "type") return "6.5rem";

  // Secondary text columns (chapter name next to primary episode, etc.)
  if (label === "chapter") return "9rem";

  // Dates
  if (label === "updated" || label === "created") return "7rem";

  // Long secondary text — primary identity columns stay fluid so they
  // expand cleanly when this column is hidden below `md`
  if (label === "description") return "42%";

  // Primary identity columns (user, episode, chapter, name, instruction, …) stay fluid
  return undefined;
}

/** Class to apply on matching `<td>` cells when a column uses `hideBelow`. */
export function columnHideClass(hideBelow?: Breakpoint): string {
  return hideBelow ? HIDE_CELL[hideBelow] : "";
}

export function DataTable({
  columns,
  embedded = false,
  children,
}: {
  columns: Column[];
  embedded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        embedded
          ? "w-full overflow-hidden"
          : "w-full overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      }
    >
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          {columns.map((col) => {
            const width = defaultWidth(col);
            return (
              <col
                key={col.label}
                className={col.hideBelow ? HIDE_COL[col.hideBelow] : undefined}
                style={width ? { width } : undefined}
              />
            );
          })}
        </colgroup>
        <thead>
          <tr className="border-b border-white/5 text-[var(--text-muted)]">
            {columns.map((col) => {
              const isIndex = col.label === "#" || col.label === "No";
              return (
                <th
                  key={col.label}
                  className={`py-2 text-[11px] font-medium uppercase tracking-[0.08em] sm:py-2.5 sm:text-xs md:py-3 ${
                    isIndex
                      ? "whitespace-nowrap px-1.5 sm:px-2 md:px-2.5"
                      : "truncate px-1.5 sm:px-3 md:px-4"
                  } ${col.align === "right" ? "text-right" : ""} ${
                    col.hideBelow ? HIDE_CELL[col.hideBelow] : ""
                  }`}
                >
                  {col.shortLabel ? (
                    <>
                      <span className="sm:hidden">{col.shortLabel}</span>
                      <span className="hidden sm:inline">{col.label}</span>
                    </>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
