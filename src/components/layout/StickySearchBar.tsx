import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function StickySearchBar() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 480);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-slate-200 shadow-lg">
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigate("/");
        }}
        className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        Rechercher un vol
      </button>
    </div>
  );
}
