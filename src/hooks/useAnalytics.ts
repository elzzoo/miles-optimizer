declare global {
  interface Window { plausible?: (event: string, opts?: { props?: Record<string, string | number> }) => void; }
}

export function useAnalytics() {
  const track = (event: string, props?: Record<string, string | number>) => {
    try {
      window.plausible?.(event, { props });
    } catch {}
  };

  return {
    trackSearch:       (from: string, to: string, cabin: number) => track("Search",        { from, to, cabin }),
    trackDealClick:    (program: string, route: string)           => track("Deal Click",    { program, route }),
    trackAlertCreated: (route: string)                            => track("Alert Created", { route }),
    trackPaywallHit:   (feature: string)                          => track("Paywall Hit",   { feature }),
    trackUpgradeClick: ()                                         => track("Upgrade Click"),
    trackBooking:      (program: string)                          => track("Booking Click", { program }),
  };
}
