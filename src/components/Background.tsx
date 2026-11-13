// Reusable dark gradient background for the whole admin panel.
// Matches the Figma theme gradient. Use it as the outer wrapper of any page.

export function Background({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Only default to min-h-dvh when the caller does not set an explicit height.
  // Dashboard needs a locked h-dvh shell so sidebar/main scroll independently.
  const hasExplicitHeight = /\b(?:h-|max-h-|min-h-)/.test(className);

  return (
    <div
      className={`bg-ramayan ${hasExplicitHeight ? "" : "min-h-dvh"} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
