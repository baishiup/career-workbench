<div align="center">

# Career Workbench

**An AI workbench that turns your fact library + a target job description into a
tailored résumé — one that's traceable, not hallucinated.**

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](./apps/web/tsconfig.json)
[![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Edge-3ecf8e)](https://supabase.com)
[![Deno](https://img.shields.io/badge/Edge-Deno-000000)](https://deno.com)
[![Tests](https://img.shields.io/badge/tests-vitest-6e9f18)](./packages/domain)

English · [中文](./README.zh-CN.md)

<!-- TODO: replace with the deployed URL once live -->

### 🔗 [Live Demo](https://career-workbench.example.com) · [Architecture](./docs/architecture.md) · [Decisions (ADRs)](docs/architecture.md#decisions)

<!-- TODO(P4): replace docs/assets/hero.svg with a real screenshot/gif of the match→generate flow -->
<img src="./docs/assets/hero.svg" alt="Career Workbench" width="860">

</div>

---

## What it is

Tailoring a résumé per role is tedious, and LLMs make it fast — but they also
invent experience you never had. Career Workbench is built around one constraint:
**keep AI useful without letting it lie.** Every generated word is anchored to a
personal _fact library_, and every match is explained with evidence, not just a
score.

The core loop: **upload résumé → fact library → browse jobs → AI match (evidence /
gaps / risks) → generate a tailored résumé → edit with AI patches you accept or
reject.**

## 🏗 Architecture at a glance

```mermaid
flowchart LR
  UI["Web SPA<br/>React 19 · HeroUI v3"] -->|imports| DM["@career-workbench/domain<br/>pure, tested model"]
  UI -->|"supabase-js · invoke()"| EF["Edge Functions (Deno)<br/>trust boundary · secrets"]
  UI -->|"RLS reads"| PG["Postgres<br/>RLS by auth.uid()"]
  EF -->|"minimal input"| AI["Dify workflows<br/>parse · match · generate · chat"]
  EF -->|"structured writes"| PG
```

The browser never calls an AI provider directly. Everything secret-bearing or
cross-user goes through an Edge Function. **Full tour →
[docs/architecture.md](./docs/architecture.md).**

## 🧩 Tech stack

| Layer    | Choices                                                                                       |
| -------- | --------------------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript (strict), Vite, Tailwind CSS v4, HeroUI v3, Zustand, assistant-ui, Quill |
| Backend  | Supabase — Auth, Postgres + RLS, Edge Functions (Deno)                                        |
| AI       | Dify workflows/chatflow (parse · job-parse · match · generate · chat) behind Edge Functions   |
| Tooling  | pnpm workspace (monorepo), Vitest, Prettier, Deno toolchain                                   |

## 📸 Screenshots

<!-- TODO(P4): drop real screenshots into docs/assets/ and reference them here -->

| Onboarding | Job match report | Résumé editor |
| ---------- | ---------------- | ------------- |
| _coming_   | _coming_         | _coming_      |

## 🚀 Quickstart

```bash
pnpm install
pnpm dev          # web only, with local fixtures — no secrets needed
```

`/` is a public landing page. The app runs in fixture mode out of the box (mock AI +
local data), so you can explore the UI without any Supabase or Dify setup. To run
the full stack (Supabase + Edge Functions + AI), see
**[development.md](./development.md)**.

```bash
pnpm check && pnpm test && pnpm build   # verify
```

## 📂 Project structure

```
apps/web              React 19 SPA (TypeScript strict)
packages/domain       Pure domain model & logic — résumé · profile · JD · patch · match
packages/mock         MSW-based mock of the Supabase stack for keyless fixture-mode dev
packages/shared       Reserved seam for shared cross-package types & schema utils
supabase/functions    Deno Edge Functions — the only place secrets live
supabase/migrations   Postgres schema + RLS
dify/                 Versioned Dify workflow definitions
docs/                 Architecture, ADRs, product, project structure
development.md        Development, validation, deployment
feature-spec/         Per-feature specs and collaboration workflow
```

## 📚 Documentation

- [Architecture](./docs/architecture.md) — the 5-minute engineering tour
- [Architecture Decisions (ADRs)](docs/architecture.md#decisions) — the _why_ behind the design
- [Data Model](./docs/architecture.md#data-model) · [Backend](./docs/architecture.md#backend)
- [Product Overview](./docs/product-overview.md) — what it does and what it deliberately doesn't
- [Development](./development.md) — run the full stack locally & deploy
- [Feature specs (中文)](./feature-spec) — deep per-feature design

---

<sub>Status: MVP. Core loop (upload → profile → job → match → generate → edit) is
wired end to end. AI run-trace and PDF export are in progress — see
[development.md](./development.md) for the live status.</sub>
