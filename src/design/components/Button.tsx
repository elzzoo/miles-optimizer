import { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:   "bg-primary text-white hover:bg-[#1D4ED8] shadow-sm",
  secondary: "bg-secondary text-white hover:bg-[#0891B2] shadow-sm",
  outline:   "bg-white text-primary border border-primary hover:bg-blue-50",
  ghost:     "bg-transparent text-slate-600 hover:bg-slate-100",
  danger:    "bg-red-500 text-white hover:bg-red-600 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3.5 rounded-xl gap-2.5 font-semibold",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
