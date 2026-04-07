# URL Params + Affiliation Redirect + Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist search state in the URL and localStorage, add a "Copy link" button, track program clicks through a backend redirect route, and expose an in-memory analytics endpoint.

**Architecture:** Three independent pieces wired together — (1) App.jsx reads URL params at mount and writes them back on every search; (2) a new Express router `server/routes/affiliation.js` handles `/api/go` (redirect + click logging) and `/api/analytics` (read log); (3) MilesCard replaces direct `bookingUrl` links with `/api/go` links so every click is logged.

**Tech Stack:** React 18 (useState lazy init, useCallback, navigator.clipboard), Express.js ESM, URLSearchParams API, localStorage, in-memory array log.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/App.jsx` | Modify | Lazy-init state from URL params + localStorage; update URL + localStorage on search; copy link button |
| `src/i18n/en.js` | Modify | Add `linkCopied: "Copied! ✅"` |
| `src/i18n/fr.js` | Modify | Add `linkCopied: "Copié ! ✅"` |
| `server/routes/affiliation.js` | Create | `/api/go` redirect route + `/api/analytics` read endpoint |
| `server.js` | Modify | Register affiliation router |
| `src/components/MilesCard.jsx` | Modify | Accept `origin`/`dest`/`cabin` props; build `/api/go` href |

---

### Task 1: URL params + localStorage in App.jsx

**Files:**
- Modify: `src/App.jsx`

**Context:**
Current `App.jsx` initializes `origin`, `dest`, `cabin`, `tripType` with hardcoded defaults. We replace those with lazy initialisers that read `?from=DSS&to=CDG&cabin=1&type=round` from the URL first, localStorage second, hardcoded defaults last. On every search (`handleSearch`) we write the values back to the URL and localStorage.

- [ ] **Step 1: Add helper functions above the App component**

Open `src/App.jsx`. After the import block and before `export default function App()`, add:

```js
// --- URL param + localStorage helpers ---
const _p = () => new URLSearchParams(window.location.search);
const _ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };

function saveSearch(origin, dest, cabin, tripType) {
  const qs = new URLSearchParams({ from: origin, to: dest, cabin: String(cabin), type: tripType });
  history.replaceState(null, "", "?" + qs.toString());
  try {
    localStorage.setItem("mo-origin", origin);
    localStorage.setItem("mo-dest", dest);
    localStorage.setItem("mo-cabin", String(cabin));
    localStorage.setItem("mo-type", tripType);
  } catch { /* storage full — ignore */ }
}
```

- [ ] **Step 2: Replace the four hardcoded useState initialisers**

Replace:
```js
  const [origin, setOrigin] = useState("DSS");
  const [dest, setDest] = useState("IST");
  const [tripType, setTripType] = useState("round");
  const [cabin, setCabin] = useState(1);
```

With (keeping their positions relative to each other):
```js
  const [origin, setOrigin] = useState(() => _p().get("from") || _ls("mo-origin", "DSS"));
  const [dest, setDest] = useState(() => _p().get("to") || _ls("mo-dest", "IST"));
  const [tripType, setTripType] = useState(() => _p().get("type") || _ls("mo-type", "round"));
  const [cabin, setCabin] = useState(() => {
    const p = _p();
    const raw = p.has("cabin") ? Number(p.get("cabin")) : Number(_ls("mo-cabin", 1));
    return Number.isFinite(raw) ? raw : 1;
  });
```

- [ ] **Step 3: Call `saveSearch` in `handleSearch`**

In `handleSearch`, add `saveSearch(origin, dest, cabin, tripType);` after `reset()` and before the `new URLSearchParams(...)` line. Also add `tripType` to the useCallback dependency array.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: read/write URL params and localStorage on search"
```

---

### Task 2: Copy link button + i18n keys

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/i18n/en.js`
- Modify: `src/i18n/fr.js`

- [ ] **Step 1: Add `linkCopied` to `src/i18n/en.js`**

After the `btnCopyLink` line, add:
```js
  linkCopied: "Copied! ✅",
```

- [ ] **Step 2: Add `linkCopied` to `src/i18n/fr.js`**

After the `btnCopyLink` line, add:
```js
  linkCopied: "Copié ! ✅",
```

- [ ] **Step 3: Add `copied` state and handler in App.jsx**

Add after the other useState declarations:
```js
  const [copied, setCopied] = useState(false);
```

Add after `handleSwap`:
```js
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);
```

- [ ] **Step 4: Add the button in the JSX**

Inside `{searched && (...)}`, after the route summary pill div (`<div className="flex justify-center mb-3">...</div>`), add:

```jsx
            {/* Copy link button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={handleCopyLink}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-indigo-200 hover:bg-white/20 transition-colors border border-white/10"
              >
                {copied ? t.linkCopied : t.btnCopyLink}
              </button>
            </div>
```

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/i18n/en.js src/i18n/fr.js
git commit -m "feat: copy link button with 2s feedback"
```

---

## Context

- Project at `/tmp/miles-optimizer` — freshly cloned from GitHub
- React 18 + Vite frontend, Express.js backend (Node ESM)
- No test runner configured
- `useCallback` and `useState` are already imported in App.jsx
- The i18n files already have `btnCopyLink` — only `linkCopied` is new
- Read each file before editing to understand current state

## Your Job

1. Write the Plan 3 doc file (content provided above)
2. Commit the plan doc: `git add docs/ && git commit -m "docs: Plan 3 — URL params + affiliation redirect + analytics"`
3. Implement Task 1 exactly as specified, commit
4. Implement Task 2 exactly as specified, commit
5. Self-review all changes
6. Report back

Work from: `/tmp/miles-optimizer`

## Report Format

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- Files changed and commit SHAs
- Self-review findings
