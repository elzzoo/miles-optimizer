import { ReactNode } from "react";
interface CardProps { children: ReactNode; className?: string; padding?: "none"|"sm"|"md"|"lg"; hover?: boolean; }
export default function Card({ children, className="", padding="md", hover=false }: CardProps) {
  const p = { none:"", sm:"p-3", md:"p-5", lg:"p-7" }[padding];
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${p} ${hover?"hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer":""} ${className}`}>
      {children}
    </div>
  );
}
