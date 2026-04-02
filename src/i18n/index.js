import { useState, useEffect, useCallback } from "react";
import en from "./en.js";
import fr from "./fr.js";

const DICTS = { en, fr };
const LS_KEY = "miles-optimizer-lang";

function detectLang() {
  const saved = localStorage.getItem(LS_KEY);
  if (saved && DICTS[saved]) return saved;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return DICTS[nav] ? nav : "en";
}

export function useTranslation() {
  const [lang, setLangState] = useState(detectLang);

  const setLang = useCallback((l) => {
    localStorage.setItem(LS_KEY, l);
    setLangState(l);
    document.documentElement.lang = l;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = DICTS[lang];

  return { t, lang, setLang };
}
