<div align="center">

# 🧭 Lore

### Cartography of Stories

**Turn the books and shows you love into one explorable world: a hand-drawn realm map, original places and characters, and a canon that stays consistent.**

`React` · `TypeScript` · `Express` · `Firebase` · `Gemini` · `Tailwind`

[Live demo](#) · [Screenshots](#screenshots) · [How it works](#how-it-works) · [Security](#security)

</div>

---

## What is Lore?

Worldbuilding takes weeks. Lore does the first draft in minutes.

Give it a book, a show, or a few lines describing a setting. Lore builds an original world from it: places, characters, factions, themes and story hooks, laid out on an interactive atlas-style map. Blend two or three titles and Lore invents **bridge places** that connect them into a single converged world. When you start editing, a **canon check** flags contradictions before they reach your players or readers.

Built for writers, tabletop game masters, and anyone who finishes a great story and wants to stay in its world.

> Lore never reproduces text from the source works. It only uses titles you provide and generates original descriptions.

## Features

| | |
|---|---|
| **World generation** | Enter a title (or describe a setting) and get 5–8 original places, 4–6 characters, themes and a short blurb. |
| **Convergence** | Blend 2+ titles into one map. Lore generates original bridge places and marks each place by its source with a coloured seal. |
| **Interactive realm map** | Places are pins on a parchment-style map, connected by routes. Click one to read its description and linked characters. |
| **Editable worlds** | Rename, edit and delete places and characters, lock the ones you love, and regenerate a single place on demand. |
| **Canon check** | An AI continuity pass that lists contradictions in your world, with a suggested fix for each. |
| **Six moods** | Cozy, Eerie, Epic, Melancholy, Hopeful, Chaotic. Each re-themes the whole interface and renders a procedural wallpaper. |
| **Recommendations** | A catalogue of 60 books and shows ranked against your world's themes. |
| **Campaign pack export** | Download places, characters and story hooks as Markdown for your next session. |
| **Share links** | Make a world public and send a read-only link. |

## Screenshots

> Add screenshots here before submission:
>
> `docs/landing.png` · `docs/realm-map.png` · `docs/moods.png` · `docs/canon-check.png`

```md
![Landing page](docs/landing.png)
![Realm map](docs/realm-map.png)
```

## How it works

```
Browser (React + Vite)
   │  Firebase Auth (Google sign-in) → ID token
   ▼
Express server (server.ts)
   ├─ verifies the Firebase ID token on every /api/lore/* call
   ├─ reserves a rate-limit slot (per-user + global daily cap)
   ├─ checks the generation cache
   ├─ calls Gemini with a strict "JSON only" prompt
   ├─ validates the output with Zod (retries once on invalid JSON)
   ▼
Cloud Firestore  ←  the client saves worlds under the signed-in user
```

**Generation pipeline.** Input is length-limited and sanitised. The server looks for a cached world for the same title, type and note. On a miss it asks Gemini for strict JSON, validates it against a Zod schema, retries once with the error appended if it is invalid, then returns the world. Themes come from a fixed list of 20, so every world has a comparable theme vector.

**Recommendations are not LLM-ranked.** Each catalogue item has a 20-length theme vector. Lore averages the theme vectors of your worlds and ranks catalogue items by **cosine similarity**, with a small boost when the item's mood matches your selected mood. The LLM is not involved in the ranking.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Flow |
| Backend | Node.js, Express, TypeScript (`tsx`) |
| AI | Google Gemini via `@google/genai`, Zod for output validation |
| Auth & data | Firebase Authentication, Cloud Firestore |
| Built with | Google AI Studio (Build mode) |

## Project structure

```
server.ts                 Express server, auth middleware, security headers, API routes
firestore.rules           Firestore security rules
src/
  server/generateWorld.ts Generation, regeneration, canon check, rate limiting
  services/               Firestore access and the recommendation engine
  components/             Landing, dashboard, add-title, world page, map, moods
  data/catalogData.ts     60-item recommendation catalogue
  constants/themes.ts     The 20 fixed themes
```

## Run locally

**Prerequisites:** Node.js 20+ and a Firebase project with Google sign-in and Cloud Firestore enabled.

```bash
git clone https://github.com/esd-project-tiu/lore.git
cd lore
npm install --legacy-peer-deps   # or: bun install
```

Create `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key
# Optional: cap on total AI calls per day across all users (default 300)
GLOBAL_DAILY_GEMINI_CAP=300
```

Put your Firebase web config in `firebase-applet-config.json`, deploy `firestore.rules` to your project, then start the app:

```bash
npm run dev      # http://localhost:3000
npm run lint     # type-check
npm run build    # production build
```

The Gemini key lives only on the server and is never sent to the browser. Get a free key from [Google AI Studio](https://aistudio.google.com).

## Security

Lore was hardened after a manual review of the first working version.

- **Authenticated API.** Every `/api/lore/*` route requires a Firebase ID token, verified server-side. The user id comes from the verified token, never from the request body. Missing or invalid tokens return `401`.
- **Server-side rate limiting.** Each user gets 10 AI actions per day. A slot is reserved *before* Gemini is called, so parallel requests cannot race past the limit. Regeneration and canon checks count against the same quota.
- **Global daily cap.** A server-wide ceiling protects the free Gemini quota from abuse.
- **Tamper-resistant counters.** Firestore usage counters can only move forward. The server's own counter is the source of truth, so a user cannot reset their quota from the browser.
- **Strict Firestore rules.** Worlds are owner-only with field validation. The recommendation catalogue is read-only for clients.
- **Validated AI output.** Gemini responses are parsed and validated with Zod. Array sizes and string lengths are bounded on every input.
- **Key hygiene.** `GEMINI_API_KEY` is a server-side secret. `.env*` files are git-ignored.
- **Safer rendering and headers.** React-escaped output with no raw HTML injection, plus standard security headers.

### Known limitations and roadmap

- The rate limiter keeps state in memory per server instance. Running several instances would need the Firebase Admin SDK or a shared store.
- Shared worlds currently live in the same document as private ones. Moving public worlds into a separate sanitised `public_worlds` collection (so private notes are never readable) is planned.
- Free-tier AI quotas limit how many worlds can be generated per day.

## Roadmap

- [ ] Sanitised `public_worlds` collection for share links
- [ ] Admin-SDK rate limiting for multi-instance deployments
- [ ] PNG export for the realm map
- [ ] Ambient mood soundscapes (Web Audio)
- [ ] Reading DNA card: a shareable poster of your theme profile

## Team

| Name | Role |
|---|---|
| D Dutta | Idea, product, full-stack, security review |
| _Add teammate_ | _Role_ |

Built at **Techno India University, Kolkata** as part of the `esd-project-tiu` project.

## Acknowledgements

Original idea developed during a Jio course capstone. Built with Google AI Studio, Firebase and Gemini. Lore references book and show titles only as user-provided input; all generated world content is original.

---

<div align="center">

*Every story is a map. Lore draws the rest.*

</div>
