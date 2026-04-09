export const tokens = {
  colors: {
    primary:    "#2563EB",
    primaryHover:"#1D4ED8",
    secondary:  "#06B6D4",
    bg:         "#F8FAFC",
    surface:    "#FFFFFF",
    text:       "#0F172A",
    muted:      "#64748B",
    subtle:     "#94A3B8",
    border:     "#E2E8F0",
    borderHover:"#CBD5E1",
    success:    "#22C55E",
    successBg:  "#F0FDF4",
    warning:    "#F59E0B",
    warningBg:  "#FFFBEB",
    danger:     "#EF4444",
    dangerBg:   "#FEF2F2",
  },
  radius: {
    sm:  "6px",
    md:  "10px",
    lg:  "14px",
    xl:  "20px",
    "2xl":"28px",
    full:"9999px",
  },
  shadow: {
    sm:   "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
    md:   "0 4px 16px rgba(0,0,0,.08)",
    lg:   "0 8px 32px rgba(0,0,0,.10)",
    blue: "0 8px 32px rgba(37,99,235,.18)",
    card: "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.03)",
  },
  font: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
};

export type Color = keyof typeof tokens.colors;
