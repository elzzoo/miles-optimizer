const TOKEN = process.env.DUFFEL_API_TOKEN;
const BASE  = "https://api.duffel.com";

function headers() {
  return {
    "Authorization":  `Bearer ${TOKEN}`,
    "Content-Type":   "application/json",
    "Accept":         "application/json",
    "Duffel-Version": "v2",
  };
}

/**
 * Parse ISO 8601 duration (PT14H30M, PT2H, PT45M) → minutes
 */
function parseDuration(iso) {
  if (!iso) return undefined;
  const h = iso.match(/(\d+)H/)?.[1] ?? 0;
  const m = iso.match(/(\d+)M/)?.[1] ?? 0;
  return Number(h) * 60 + Number(m) || undefined;
}

/**
 * Map a single Duffel offer to our internal Flight shape.
 */
function mapOffer(offer) {
  const slice   = offer.slices?.[0];
  const segment = slice?.segments?.[0];
  return {
    price:    Math.round(parseFloat(offer.total_amount || "0")),
    airline:  segment?.marketing_carrier?.iata_code || "—",
    direct:   (slice?.segments?.length ?? 1) === 1,
    stops:    (slice?.segments?.length ?? 1) - 1,
    duration: parseDuration(slice?.duration),
    depTime:  segment?.departing_at ?? undefined,
    source:   "duffel",
  };
}

/**
 * Search flights via Duffel API (offer_requests with return_offers=true).
 * Throws on config/network errors; returns { best_flights, other_flights, source } on success.
 */
export async function searchDuffelFlights({ origin, dest, depDate, retDate, cabin, passengers = 1 }) {
  if (!TOKEN) throw new Error("DUFFEL_API_TOKEN not configured");

  const cabinClass    = cabin === "1" || cabin === 1 ? "business" : "economy";
  const passengerList = Array.from({ length: Number(passengers) || 1 }, () => ({ type: "adult" }));

  const slices = [{ origin, destination: dest, departure_date: depDate }];
  if (retDate) slices.push({ origin: dest, destination: origin, departure_date: retDate });

  const body = JSON.stringify({
    data: { slices, passengers: passengerList, cabin_class: cabinClass },
  });

  const r = await fetch(`${BASE}/air/offer_requests?return_offers=true`, {
    method:  "POST",
    headers: headers(),
    body,
    signal:  AbortSignal.timeout(20000),
  });

  if (!r.ok) {
    const raw = await r.text();
    let msg = `Duffel ${r.status}`;
    try { msg = JSON.parse(raw).errors?.[0]?.message || msg; } catch {}
    throw new Error(msg);
  }

  const json   = await r.json();
  const offers = json.data?.offers ?? [];

  if (!offers.length) return { best_flights: [], other_flights: [], source: "duffel" };

  const mapped = offers
    .map(mapOffer)
    .filter(f => f.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 10);

  return {
    best_flights:  mapped.slice(0, 3),
    other_flights: mapped.slice(3),
    source: "duffel",
  };
}

export const duffelConfigured = () => !!TOKEN;
