# VerdantCards – Codebase Overview & Analysis  

## 1. High‑level Architecture  
| Layer | Technology | Details |
|-------|------------|---------|
| **Framework** | **Next.js 15 (app router)** | Uses the `app/` directory with server‑rendered pages (`layout.tsx`, `page.tsx`) and dynamic routes (`[deckId]`). |
| **Language** | **TypeScript** (strict mode enabled via `tsconfig.json`) | All source files are `.tsx` / `.ts`. |
| **Styling** | **Tailwind CSS** + **Tailwind‑merge** | Global styles in `globals.css`; UI components use Tailwind utility classes. |
| **UI Component Library** | **Radix UI** primitives wrapped in `src/components/ui/*` | Provides accessible building blocks (dialog, accordion, tooltip, etc.) with custom styling. |
| **State Management** | **React Context** (`src/context/DecksContext.tsx`) | Central store for decks, cards, and SRS scheduling. |
| **Form handling** | **react‑hook‑form** + **zod** resolvers | Validation and form state in dialogs (`AddEditCardDialog`, `CreateDeckDialog`). |
| **AI Integration** | **Genkit‑style flows** (in `trash/ai/*`) | Supports Gemini, OpenAI, Ollama via environment‑configured API keys (set in Settings UI). |
| **Persistence** | **Firebase Firestore** (client provider under `trash/firebase/`) | Real‑time updates for decks & cards, non‑blocking login & updates. |
| **Testing / Linting** | **ESLint** (via `next lint`), **TypeScript** typechecking (`npm run typecheck`) | No explicit test files observed (potential gap). |

## 2. Folder & Feature Mapping  

| Directory | Primary Purpose | Notable Files |
|-----------|----------------|---------------|
| `src/app/` | Next.js **app router** pages | `layout.tsx` (global layout), `page.tsx` (home), nested routes for decks (`[deckId]`), generation (`generate*`), settings. |
| `src/components/` | UI dialogs & higher‑level components | `AddEditCardDialog.tsx`, `CreateDeckDialog.tsx`, `DeckActionDialog.tsx`. |
| `src/components/ui/` | Primitive components (Radix + custom wrappers) | Buttons, dialogs, accordion, tooltip, etc. |
| `src/context/` | Global React Contexts | `DecksContext.tsx` (deck CRUD, SRS logic). |
| `src/hooks/` | Reusable hooks | `use-mobile.tsx` (responsive detection), `use-toast.tsx` (toast notifications). |
| `src/lib/` | Utility & type definitions | `types.ts` (Deck, Card, Review, AIProvider enums), `utils.ts` (date helpers, SRS calculation, API wrappers). |
| `trash/ai/` | Experimental AI flows (currently under `trash`) | Generation of decks from PDFs/URLs, image/quiz/video generation, study‑buddy conversation. |
| `trash/firebase/` | Firebase client wrappers | Provider, error handling, Firestore hooks (`use-collection`, `use-doc`). |
| `docs/` | Documentation & blueprint | `blueprint.md`, `backend.json`. |

## 3. Core Functional Areas  

| Feature | Implementation Highlights |
|---------|----------------------------|
| **Deck Creation (Manual & AI)** | Manual via dialogs (`CreateDeckDialog`). AI via `/generate` pages that call Genkit flows (PDF, URL, topic). |
| **Spaced Repetition System** | Logic lives in `DecksContext` – calculates next review interval based on user rating (`Again`, `Hard`, `Good`, `Easy`). |
| **Quiz Generation** | UI in `app/decks/[deckId]/quiz/page.tsx`; quizzes are generated on‑the‑fly using AI prompts (likely via `trash/ai/flows/generate-quiz-flow.ts`). |
| **Study Buddy (Chat)** | `app/decks/[deckId]/buddy/page.tsx` – interacts with AI model; context includes current deck cards. |
| **Video Generation** | `app/generate-video/page.tsx` – passes topic + optional deck context to AI video generation flow. |
| **Settings** | `app/settings/page.tsx` – lets user pick AI provider and store API keys locally (client‑side storage). |
| **Responsive UI** | `use-mobile` hook toggles mobile layout; many components are mobile‑first via Tailwind. |
| **Toast Notifications** | Centralized via `use-toast` and UI `Toast` component. |
| **Firebase Auth & Sync** | `firebase/client-provider.tsx` handles auth; Firestore hooks provide real‑time deck updates. |

## 4. Strengths  

1. **Modern stack** – Next.js 15 with app router, TypeScript, Tailwind, Radix UI gives a solid, performant baseline.  
2. **Modular UI** – Primitive components in `components/ui` are reusable and accessible.  
3. **AI‑first design** – Clear separation of AI flows (in `trash/ai`) makes future integration easy.  
4. **SRS logic embedded in context** – Centralized state simplifies deck‑wide operations and future extensions (e.g., analytics).  
5. **Firebase real‑time sync** – Enables multi‑device consistency out of the box.  

## 5. Areas for Improvement  

| Issue | Suggested Action |
|-------|------------------|
| **Missing Test Suite** – No `__tests__` or jest/playwright files observed. | Add unit tests for critical utils (`utils.ts`), context reducers, and component snapshots. Consider Cypress/E2E for flow verification (deck creation → study → quiz). |
| **AI flow placement** – AI logic lives under `trash/ai`, which is confusing for production code. | Move finalized flows to a dedicated `src/ai/` directory, expose them via a service layer (`src/services/ai.ts`). |
| **Error handling & UX** – Firebase errors are caught but UI feedback may be limited. | Centralize error handling in a reusable hook (`useErrorHandler`) and surface messages via the toast system. |
| **Performance** – Large UI component tree may cause unnecessary re‑renders. | Memoize pure components (`React.memo`) and use `useCallback` for event handlers passed down via context. |
| **Type Coverage** – While TypeScript is used, some external libraries (e.g., `canvas-confetti`) lack strict typings. | Add missing type declarations or `declare module` stubs where needed. |
| **Configuration Management** – API keys stored client‑side (localStorage) could be exposed. | Consider using HttpOnly cookies with server‑side proxy endpoints or a secure token vault; at minimum, encrypt stored keys. |
| **Code Duplication** – Similar page layouts for `add`, `buddy`, `quiz`, `study`. | Extract a shared higher‑order component or layout wrapper to reduce duplication. |
| **Documentation** – README is good, but internal docs (e.g., flow diagrams, data model) are limited. | Expand `docs/blueprint.md` with component hierarchy, state flow, and API contract diagrams. |
| **Lint/Prettier Enforced CI** – No CI config shown. | Add GitHub Actions: lint, type‑check, test, and build steps. |

## 6. Quick “Getting Started” Checklist (for new contributors)

1. **Install dependencies**  
   ```bash
   npm ci
   ```  
2. **Set up environment** – copy `.env.example` to `.env` and add Firebase config + AI provider keys.  
3. **Run dev server**  
   ```bash
   npm run dev
   ```  
4. **Explore UI** – `/` home shows decks; use “Generate” for AI deck creation.  
5. **Run type‑check**  
   ```bash
   npm run typecheck
   ```  
6. **Run lint**  
   ```bash
   npm run lint
   ```  

## 7. Suggested Next Steps for the Team  

1. **Migrate AI flows out of `trash/`**, add tests for each flow (mock AI responses).  
2. **Introduce a testing framework** (Jest + React Testing Library for unit tests; Cypress for end‑to‑end).  
3. **Implement CI pipeline** (lint, type‑check, test, build).  
4. **Refactor repeated page scaffolding** into shared components to improve maintainability.  
5. **Audit security of stored API keys** and consider a server‑side proxy for AI calls.  

---  

**Bottom line:** VerdantCards is a well‑structured Next.js application leveraging modern UI primitives and AI integration. The core architecture is solid, but adding comprehensive testing, cleaning up AI flow locations, tightening security around API keys, and improving CI will raise the project’s reliability and maintainability.
