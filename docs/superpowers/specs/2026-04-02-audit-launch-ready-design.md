# Miles Optimizer — Audit & Launch-Ready Design
**Date:** 2026-04-02
**Approach:** Launch Ready — préparer un lancement international
**Cible:** Tous les voyageurs cherchant la meilleure option cash vs miles
**Marché:** International (EN + FR au lancement, multi-devises)
**Monétisation:** Non décidée — infrastructure affiliation à poser

---

## 1. Architecture & Corrections Techniques

### Bugs à corriger
- **React hooks order** — `DestinationCard.jsx` appelle `useWeather` et `useCountryInfo` après un `return null` conditionnel. Déplacer les hooks avant toute condition.
- **Code mort** — `server/cache/airportCache.js` importé nulle part. Supprimer.
- **Promos hardcodées** — `promoActive`, `promoDaysLeft`, `promoLabel` dans `programs.js` sont figés. Les externaliser ou les supprimer si non maintenus.

### Sécurité
- Ajouter `Content-Security-Policy` header dans `server.js` :
  ```
  default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; connect-src 'self' api.open-meteo.com restcountries.com open.er-api.com
  ```
- Révoquer et régénérer le token GitHub exposé en chat.

### Résilience
- Ajouter un **Error Boundary** React global autour de `<App />` dans `main.jsx` — empêche un crash composant de bloquer toute l'interface.
- Timeout explicite de 8s sur toutes les requêtes API externes côté backend.
- Fallback structuré promos : si SerpAPI échoue → RSS feeds uniquement (déjà en place partiellement, à rendre explicite).

---

## 2. Internationalisation (i18n)

### Architecture
- Système de traductions dans `src/i18n/` :
  - `src/i18n/fr.js` — toutes les chaînes françaises
  - `src/i18n/en.js` — traductions anglaises
  - `src/i18n/index.js` — hook `useTranslation()` + détection `navigator.language`
- Toggle langue persisté dans `localStorage` (`miles-optimizer-lang`)
- `<html lang>` mis à jour dynamiquement

### Composants à mettre à jour
- Tous les textes hardcodés dans `App.jsx`, `MilesCard.jsx`, `FlightCard.jsx`, `DestinationCard.jsx`, `PromoBanner.jsx`, `AirportPicker.jsx`
- Noms de villes dans `airports.js` — ajouter champ `cityEn` et `countryEn` pour l'affichage EN
- Notes et labels dans `programs.js` — ajouter champ `notesEn`

### Devise d'affichage
- Devise configurable : USD (défaut international), EUR, FCFA, GBP
- Persistée dans `localStorage`
- Le footer affiche uniquement les taux pertinents selon la devise choisie
- Détection automatique optionnelle via `Intl.NumberFormat().resolvedOptions().locale`

---

## 3. UX/UI & Mobile

### Persistance & Partage
- **URL params** : `?from=DSS&to=CDG&cabin=1&type=round` — lecture au montage, mise à jour à chaque recherche
- **localStorage** : origin, dest, cabin, tripType sauvegardés entre sessions
- Bouton "Copier le lien" sur les résultats

### Layout Responsive
- Mobile (< 768px) : layout actuel, colonne unique — conservé tel quel
- Desktop (≥ 1024px) : layout 2 colonnes — formulaire à gauche (sticky), résultats à droite
- Tablette (768-1024px) : colonne unique élargie (`max-w-2xl`)

### Onboarding
- Tooltip "What are miles?" au premier chargement (détecté via `localStorage`) — modal léger en 3 étapes : qu'est-ce qu'un mile, comment ça marche, comment utiliser l'app
- Dismissable, ne réapparaît pas

### PWA
- `manifest.json` avec name, icons, theme_color, display standalone
- Favicon SVG réel (avion + gradient)
- Service Worker basique pour cache des assets statiques (via Vite PWA plugin)

### Améliorations UI
- Footer lisibilité : passer `text-indigo-400` au lieu de `text-indigo-600` sur fond sombre
- Page 404 personnalisée
- `loading` state plus précis : indiquer "Google ✅ · Sky en cours..." pendant la recherche partielle

---

## 4. Données Miles — Précision & Nouveaux Programmes

### Infrastructure des données
- Ajouter `updatedAt: "2026-04"` à chaque programme dans `programs.js`
- Avertissement UI si `updatedAt` > 90 jours
- Mode double achat/possession :
  - "J'achète des miles" → `pricePMile` utilisé (comportement actuel)
  - "J'ai déjà des miles" → `pricePMile = 0`, seules les taxes comptent

### Calcul valeur par mile (cpp)
- Afficher dans MilesCard : **valeur du mile implicite** = `(cashUSD - taxes) / milesUsed` en cents
- Exemple : vol $1200, 50 000 miles + $80 taxes → valeur implicite = `($1200 - $80) / 50 000 = 2.24 cpp`
- Benchmark affiché : "Excellent (> 2¢)" / "Bon (1-2¢)" / "Faible (< 1¢)"

### Programmes à ajouter
**Star Alliance / indépendants :**
- Singapore Airlines KrisFlyer
- Ethiopian Airlines ShebaMiles
- Brussels Airlines Miles & More (Lufthansa Group)
- Aegean Airlines Miles+Bonus

**OneWorld :**
- Emirates Skywards
- Etihad Guest
- Oman Air Sindbad

**SkyTeam :**
- Kenya Airways Asante Miles
- Air France/KLM Flying Blue (déjà présent — enrichir)

**Africains / régionaux :**
- Air Senegal (programme fidélité)
- Royal Air Maroc Safar Flyer
- Tunisair Fidelys

**Total cible : ~20 programmes** (vs 8 actuellement)

### Barèmes
- Documenter les sources et dates pour chaque barème dans un commentaire
- Ajouter un lien vers la page officielle du barème par programme

---

## 5. SEO & Discoverabilité

### Pages statiques indexables
- Landing page statique sur `/` : hero, comment ça marche, programmes supportés, FAQ, CTA — contenu HTML pur indexable par Google
- L'app de calcul est accessible via bouton CTA "Comparer maintenant" → route `/app`
- Le router côté serveur Express gère `/` (landing) et `/app` (SPA React)

### Fichiers SEO
- `public/robots.txt` — allow all, sitemap pointer
- `public/sitemap.xml` — pages statiques
- Meta tags dynamiques via fonction `updateMeta(title, description)` appelée à chaque recherche

### Performance (Core Web Vitals)
- Google Fonts : passer à `display=swap` + `<link rel="preload">`
- Vite code splitting : lazy load `MilesCard`, `FlightCard`, `PromoBanner`
- Preconnect hints pour Open-Meteo, REST Countries dans `index.html`

---

## 6. Monétisation & Affiliation

### Système de redirection
- Route backend `/api/go?program=aeroplan&ref=milescard` :
  - Enregistre le clic (analytics)
  - Redirige vers l'URL du programme (avec paramètres affiliation si configurés)
- Tous les `bookingUrl` remplacés par ce système dans `programs.js`
- Variable d'env `AFFILIATE_LINKS` JSON optionnelle — format : `{"aeroplan":"https://...?ref=xyz","lifemiles":"https://...?aid=123"}` — si absente ou programme absent, redirige directement vers `bookingUrl`

### Analytics des clics
- Événement `click_book_miles` loggé côté serveur avec : programme, route, cabin, timestamp
- Endpoint `/api/analytics` (POST) — stocke en mémoire pour l'instant, exportable
- Prépare les données de conversion pour négocier avec des partenaires affiliation

### RGPD
- Banner cookie minimaliste (désactivé par défaut, activable via env var `COOKIE_CONSENT=true`)
- Pas de cookies tiers pour l'instant — uniquement localStorage

### Partenaires affiliation à intégrer (phase 2)
- Travelpayouts (60+ compagnies, programme FR disponible)
- Skyscanner Partner API (commission sur réservations)
- Programmes directs miles : LifeMiles, Aeroplan ont des programmes d'affiliation sur achat de miles

---

## 7. Performance & Fiabilité Production

### Cold Start Render
- Cron ping toutes les 14min via service externe gratuit (UptimeRobot ou Cron-job.org) sur `/api/health`
- Alternative : migrer vers Render paid ($7/mois) — recommandé dès les premiers utilisateurs réels

### Timeouts & Dégradation
- Chaque appel API externe : `AbortController` avec timeout 8s
- Ordre de priorité promos : SerpAPI → RSS feeds → cache précédent → message "indisponible"
- Si Google Flights ET Skyscanner échouent : afficher estimation avec explication claire + lien direct vers Google Flights

### Monitoring
- Endpoint `/api/health` enrichi : état du cache, dernière erreur API, uptime
- Log structuré des erreurs API (programme, route, status, timestamp) pour débogage

---

## Priorisation d'implémentation

| Priorité | Item | Impact | Effort |
|---|---|---|---|
| 🔴 P0 | Bug hooks React (DestinationCard) | Crash prod | 30min |
| 🔴 P0 | Ajout CSP header | Sécurité | 30min |
| 🔴 P1 | i18n FR/EN + toggle | Lancement international | 3-4j |
| 🔴 P1 | Devise configurable (USD défaut) | Lancement international | 1j |
| 🟠 P2 | URL params + localStorage | Rétention | 1j |
| 🟠 P2 | Nouveaux programmes miles (~12) | Valeur produit | 2j |
| 🟠 P2 | Calcul valeur par mile (cpp) | Différenciation | 4h |
| 🟠 P2 | Système redirection affiliation | Monétisation | 1j |
| 🟡 P3 | Landing page SEO | Discoverabilité | 2j |
| 🟡 P3 | Layout desktop 2 colonnes | UX desktop | 1j |
| 🟡 P3 | Error Boundary + onboarding | Qualité | 1j |
| 🟡 P3 | PWA manifest + favicon | Mobile | 4h |
| 🟢 P4 | Mode "j'ai déjà des miles" | Précision | 4h |
| 🟢 P4 | Service Worker cache | Performance | 4h |
| 🟢 P4 | Analytics clics affiliation | Data | 4h |
