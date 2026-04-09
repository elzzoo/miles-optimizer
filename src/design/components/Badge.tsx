import { ReactNode } from "react";

type Variant = "success" | "warning" | "danger" | "primary" | "secondary" | "neutral";

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const styles: Record<Variant, string> = {
  success:   "bg-green-50  text-green-700  border-green-200",
  warning:   "bg-amber-50  text-amber-700  border-amber-200",
  danger:    "bg-red-50    text-red-700    border-red-200",
  primary:   "bg-blue-50   text-blue-700   border-blue-200",
  secondary: "bg-cyan-50   text-cyan-700   border-cyan-200",
  neutral:   "bg-slate-100 text-slate-600  border-slate-200",
};

const dotColors: Record<Variant, string> = {
  success:   "bg-green-500",
  warning:   "bg-amber-500",
  danger:    "bg-red-500",
  primary:   "bg-blue-500",
  secondary: "bg-cyan-500",
  neutral:   "bg-slate-400",
};

export default function Badge({ variant = "neutral", children, dot = false, className = "" }: BadgeProps) {
  return (
    <span className={[
      "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border",
      styles[variant],
      className,
    ].join(" ")}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
