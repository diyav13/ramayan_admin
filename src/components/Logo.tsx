import Image from "next/image";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const heights = { sm: 48, md: 72, lg: 96 };
  const h = heights[size];

  return (
    <Image
      src="/images/logo.png"
      alt="Ramayana"
      width={Math.round(h * 1.8)}
      height={h}
      priority
      className="object-contain"
    />
  );
}
