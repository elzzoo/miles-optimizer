import { Outlet, useLocation } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import StickySearchBar from "../../components/layout/StickySearchBar";

export default function PageLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Header />
      <main>
        <Outlet />
      </main>
      {isHome && <StickySearchBar />}
      <Footer />
    </div>
  );
}
