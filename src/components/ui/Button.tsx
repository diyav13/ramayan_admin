import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "md" | "sm";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[var(--gold)] text-black hover:brightness-110",
    secondary: "bg-[var(--surface-alt)] text-white hover:bg-[var(--surface)]",
  };
  const sizes = {
    md: "h-12 px-5 text-sm",
    sm: "h-10 px-4 text-xs",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
