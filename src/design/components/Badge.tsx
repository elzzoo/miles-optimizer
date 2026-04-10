import { ReactNode } from "react";
type V = "success"|"warning"|"danger"|"primary"|"neutral"|"purple";
const S:Record<V,string> = {
  success:"bg-green-100 text-green-700 border-green-200",
  warning:"bg-amber-100 text-amber-700 border-amber-200",
  danger:"bg-red-100 text-red-700 border-red-200",
  primary:"bg-blue-100 text-blue-700 border-blue-200",
  neutral:"bg-slate-100 text-slate-600 border-slate-200",
  purple:"bg-violet-100 text-violet-700 border-violet-200",
};
export default function Badge({ children, variant="neutral" as V, size="sm", className="" }: { children:ReactNode; variant?:V; size?:"sm"|"md"; className?:string }) {
  return <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${S[variant]} ${size==="sm"?"text-xs px-2 py-0.5":"text-sm px-3 py-1"} ${className}`}>{children}</span>;
}
