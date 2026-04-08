import { useState, useEffect } from "react";
import type { CountryInfo } from "../types.js";

export function useCountryInfo(iso2) {
  const [info, setInfo] = useState<CountryInfo | null>(null);

  useEffect(() => {
    if (!iso2) return;
    setInfo(null);
    fetch(`/api/country?iso2=${iso2}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(setInfo)
      .catch(() => {});
  }, [iso2]);

  return info;
}
