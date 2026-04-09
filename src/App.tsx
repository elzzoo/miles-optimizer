import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import PageLayout from "./design/layouts/PageLayout";
import Skeleton from "./design/components/Skeleton";

// Eager (pages critiques)
import Home   from "./pages/Home";
import Search from "./pages/Search";

// Lazy (code splitting)
const BestDeals  = lazy(() => import("./pages/BestDeals"));
const Explore    = lazy(() => import("./pages/Explore"));
const Alerts     = lazy(() => import("./pages/Alerts"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Premium    = lazy(() => import("./pages/Premium"));
const RouteGuide = lazy(() => import("./pages/seo/RouteGuide"));

function PageLoader() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Skeleton variant="card" />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PageLayout />}>
            <Route index             element={<Home />} />
            <Route path="/search"    element={<Search />} />
            <Route path="/best-deals"
              element={<Suspense fallback={<PageLoader />}><BestDeals /></Suspense>} />
            <Route path="/explore"
              element={<Suspense fallback={<PageLoader />}><Explore /></Suspense>} />
            <Route path="/alerts"
              element={<Suspense fallback={<PageLoader />}><Alerts /></Suspense>} />
            <Route path="/calculator"
              element={<Suspense fallback={<PageLoader />}><Calculator /></Suspense>} />
            <Route path="/premium"
              element={<Suspense fallback={<PageLoader />}><Premium /></Suspense>} />
            {/* SEO routes dynamiques — catch-all en dernier */}
            <Route path="/:slug"
              element={<Suspense fallback={<PageLoader />}><RouteGuide /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
