import React from "react";
import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.jsx";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '24px' }}>
          <div style={{ fontSize: '48px' }}>✈️</div>
          <p style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '18px', textAlign: 'center' }}>Une erreur est survenue</p>
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>Rechargez la page pour réessayer.</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); }}
            style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
