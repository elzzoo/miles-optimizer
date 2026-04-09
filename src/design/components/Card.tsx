import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
  className?: string;
}

const paddings = {
  none: "",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6",
};

export default function Card({ children, hover = false, padding = "md", className = "", ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        "bg-white rounded-2xl border border-slate-100",
        "shadow-[0_2px_8px_rgba(0,0,0,.06)]",
        hover ? "transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,.10)] hover:-translate-y-0.5 cursor-pointer" : "",
        paddings[padding],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
