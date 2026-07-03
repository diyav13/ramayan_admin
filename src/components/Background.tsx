// Reusable dark gradient background for the whole admin panel.
// Matches the Figma theme gradient. Use it as the outer wrapper of any page.

export function Background({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`bg-ramayan min-h-screen ${className}`}>{children}</div>;
}
