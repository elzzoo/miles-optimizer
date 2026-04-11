import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSearchQuota } from "../../hooks/useSearchQuota";

const NAV = [
  { to: "/best-deals",  label: "Meilleurs deals" },
  { to: "/explore",     label: "Explorer" },
  { to: "/calculator",  label: "Calculateur" },
  { to: "/alerts",      label: "Alertes" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const quota = useSearchQuota();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-[15px] tracking-tight">Miles Optimizer</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/8 text-primary"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/search")}
            className="hidden md:flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Rechercher
          </button>

          {/* Search quota pill */}
          {!quota.exhausted ? (
            <span className="hidden md:flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              {quota.remaining} recherche{quota.remaining > 1 ? "s" : ""} gratuite{quota.remaining > 1 ? "s" : ""}
            </span>
          ) : (
            <Link to="/premium" className="hidden md:flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold hover:bg-amber-100 transition-colors">
              Quota atteint · Premium →
            </Link>
          )}

          <Link
            to="/premium"
            className="hidden md:flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-sm"
          >
            ⭐ Premium
          </Link>

          {/* Hamburger mobile */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label="Menu"
          >
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {label}
            </Link>
          ))}
          <Link
            to="/premium"
            onClick={() => setOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-primary bg-blue-50 mt-2"
          >
            ⭐ Passer Premium
          </Link>
        </div>
      )}
    </header>
  );
}
