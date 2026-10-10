# Cyberpunk OS

**Immersive neural interface OS** — multi-window terminals, real-time 3D, Command Bus architecture, achievements, and an AI oracle. Fully static. GitHub Pages ready.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)

> *A portfolio-grade experiment in systems UI: everything is a command, the scene is isolated for 60 FPS, and the workspace persists.*

---

## Features

| Area | Details |
|------|---------|
| **Windows** | Multi-terminal, drag, Genie minimize (macOS-style), dock restore |
| **3D** | R3F scene, custom hologram shader, clickable core & nodes, Bloom |
| **Terminal** | History (↑↓), Tab autocomplete, aliases, color-coded logs |
| **Commands** | Typed Command Bus — `scan`, `login`, `ask`, `window`, `save`… |
| **Progression** | Achievements, auth unlocks, persistent history & workspace |
| **AI** | Multi-provider oracle — offline + Groq / OpenAI / Gemini / OpenRouter |
| **Multiplayer** | `join` grid — Supabase Realtime or simulated peers |
| **Filesystem** | `ls` `cd` `cat` `tree` `pwd` simulated VFS |
| **Themes** | `theme cyan|magenta|green` |
| **Windows** | Drag + **resize handle** + Genie minimize |
| **Polish** | Boot sequence, Web Audio SFX, toasts, CRT overlay |

---

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

### Multi-AI oracle (optional live providers)

Offline oracle always works. Wire one or more keys in `.env`:

| Provider | Env var | Notes |
|----------|---------|--------|
| **offline** | — | Built-in cyberpunk replies |
| **groq** | `VITE_GROQ_API_KEY` | Free tier — [console.groq.com](https://console.groq.com) |
| **openai** | `VITE_OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |
| **gemini** | `VITE_GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **openrouter** | `VITE_OPENROUTER_API_KEY` | Many models — [openrouter.ai](https://openrouter.ai/keys) |
| | `VITE_OPENROUTER_MODEL` | Optional model id |

```bash
cp .env.example .env
# fill keys, then:
npm run dev
```

In the terminal:

```text
provider              # list backends + active
provider groq         # switch default
ask what is the matrix
ask @gemini explain the core
ask --openai hello
```

If a live key is missing or the request fails, the oracle falls back to offline.

---

## Demo flow (for recording)

Use this ~25s script:

1. **Boot** — logo + system checks + progress bar  
2. First terminal appears → type `help`  
3. `window` → second terminal  
4. Minimize one (**–**) → Genie animation → restore from **dock**  
5. Click the **glowing core** in 3D  
6. `login` → enter any name → user panel + unlock toast  
7. `ask who are you` → oracle reply  
8. `achievements` → show progression  

---

## Commands

| Command | Description |
|---------|-------------|
| `help` | List commands / details |
| `status` | System & link status |
| `scan [target]` | Async network scan |
| `window` | Open new terminal |
| `alias name cmd` | Create alias |
| `ask <question>` | Neural AI oracle |
| `login` / `logout` | Auth session |
| `profile` / `matrix` | Auth-only features |
| `save` / `load` | Workspace persist |
| `achievements` | Unlock list |
| `mute` | Toggle sound |
| `clear` / `whoami` / `about` | Utilities |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  UI Layer                                                   │
│  Header · Dock · TerminalWindow(s) · UserPanel · Toasts     │
└──────────────────────────┬──────────────────────────────────┘
                           │ dispatch / selectors only
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Command Bus                                                │
│  parse → validate → middleware → handler.execute(ctx)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Zustand Store      │         │  Side effects       │
│  windows · auth     │◄───────►│  sound · AI · 3D    │
│  history · aliases  │         │  localStorage       │
│  achievements       │         └─────────────────────┘
└─────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  3D Scene (lazy, memoized, isolated Canvas)                 │
│  Shader core · rings · Stars · Bloom · click handlers       │
└─────────────────────────────────────────────────────────────┘
```

**Design choices worth discussing in interviews**

- **Command Bus** — UI never calls business logic directly; every action is a typed command with metadata (help, aliases, validation).
- **Fine-grained Zustand selectors** — terminal updates do not re-render the R3F Canvas.
- **Static-first** — no server required; optional Groq key is client-side only for the demo oracle.
- **Performance** — `dpr` capped, Bloom over MSAA, memoized geometry, log buffers hard-capped.

---

## Build & Deploy (GitHub Pages)

```bash
npm run build
# deploy the dist/ folder
```

`vite.config.ts` uses `base: './'` so relative assets work on project pages.

**GitHub Pages tips**

1. Repo → Settings → Pages → Deploy from **GitHub Actions** or `/docs` / `dist`
2. Or: `npx gh-pages -d dist` after adding the `gh-pages` package

---

## Tech Stack

- **Vite 5** + **React 18** + **TypeScript**
- **React Three Fiber** + **Drei** (postprocessing, Stars, controls)
- **Zustand** (`subscribeWithSelector`)
- **Tailwind CSS**
- **Custom Command Bus** (no Redux / no server)
- **Web Audio API** (zero dependency SFX)

---

## Project structure

```text
src/
├── core/CommandBus.ts      # parse, register, middleware
├── commands/index.ts       # all handlers
├── store/useCyberpunkStore.ts
├── scenes/Scene.tsx        # R3F + shader
├── components/             # App, TerminalWindow, Dock, Boot…
└── lib/                    # sound, ai, persistence, achievements
```

---

## License

MIT
