import { ReactNode, ButtonHTMLAttributes } from "react";
type V = "primary"|"secondary"|"ghost"|"danger";
type S = "sm"|"md"|"lg";
const VS:Record<V,string> = {
  primary:"bg-primary text-white hover:bg-[#1D4ED8] shadow-sm",
  secondary:"bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm",
  ghost:"text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger:"bg-red-500 text-white hover:bg-red-600 shadow-sm",
};
const SS:Record<S,string> = { sm:"text-xs px-3 py-1.5 rounded-lg", md:"text-sm px-4 py-2.5 rounded-xl", lg:"text-base px-6 py-3 rounded-xl" };
interface P extends ButtonHTMLAttributes<HTMLButtonElement> { children:ReactNode; variant?:V; size?:S; loading?:boolean; fullWidth?:boolean; }
export default function Button({ children, variant="primary", size="md", loading=false, fullWidth=false, className="", disabled, ...props }:P) {
  return (
    <button {...props} disabled={disabled||loading} className={`inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${VS[variant]} ${SS[size]} ${fullWidth?"w-full":""} ${className}`}>
      {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
      {children}
    </button>
  );
}
