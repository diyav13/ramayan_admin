// Shared table shell: bordered surface + header row. Each page renders its own
// rows as children so the cell layout stays flexible per module.

type Column = {
  label: string;
  align?: "left" | "right";
};

export function DataTable({
  columns,
  minWidth = 720,
  embedded = false,
  children,
}: {
  columns: Column[];
  minWidth?: number;
  embedded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        embedded
          ? "overflow-x-auto"
          : "overflow-x-auto rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      }
    >
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-white/5 text-[var(--text-muted)]">
            {columns.map((col) => (
              <th
                key={col.label}
                className={`px-4 py-3 font-medium ${
                  col.align === "right" ? "text-right" : ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
