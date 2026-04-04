<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Metadata
- Owner: `Hans`
- Last reviewed: `2026-04-04`
- Review cadence: `quarterly`

## Repository Signals Checklist
- Run via `glob`/`read` equivalents when operating inside OpenCode to stay within allowed tooling.

- Inspect TypeScript style:
  ```bash
  # Inspect tsconfig.json and next-env.d.ts
  ```
- Lockfile audit: Canonical package manager is **pnpm** (evidenced by `pnpm-lock.yaml`).
- Monorepo/workspace detection: Workspace configured via `pnpm-workspace.yaml`.

## Scope & Precedence
- Global safety/security rules remain primary. Conflict order: Safety/data integrity > Security > User intent/spec > Workflow/process > Style.
- This file records repo-specific deltas; deviations from global config are intentional for this Next.js workspace.

## Project Context
- Stack: Next.js 16.2.2, React 19, TypeScript, TailwindCSS v4, Langchain, @uiw/react-md-editor (cited from `package.json`).
- Architecture: A modern Next.js web application utilizing Langchain for AI interactions, presumably for clinical scribing/note-taking workflows with rich-text editor components.
- Critical paths: AI prompt execution logic (Langchain), text parsing, and sensitive clinical data handling. Require extra review for features touching data ingress/egress.

## Commands (Use Exactly)
- Install: `pnpm install` (evidence: `pnpm-lock.yaml` and `pnpm-workspace.yaml`).
- Lint: `pnpm run lint` (evidence: `eslint` script in `package.json`).
- Build/Typecheck: `pnpm run build` (evidence: `next build` script in `package.json`).
- Unit tests: `<TBD>` (No test script in `package.json`).
- Integration/E2E: `<TBD>` (No e2e script in `package.json`).
- Pre-merge verify: `pnpm run lint && pnpm run build`

### Granular Testing *(single-file & single-case required)*
- Single test file: `<TBD>`
- Single test case: `<TBD>`

## Rule Inheritance
- `.cursorrules`: None detected on 2026-04-04.
- `.github/copilot-instructions.md`: None detected on 2026-04-04.

## Policy Tiers
- **MUST** – blocking requirements; violation halts work.
- **SHOULD** – strong default; deviations must be justified in Validation Notes.
- **MAY** – optional guidance; apply when it fits task constraints.

## Rule Precedence
1. Safety & data integrity
2. Security
3. User intent / specs
4. Workflow & process
5. Style preferences

## Agent Behavior
- Confirm destructive actions with explicit impact before execution.
- Plan first for efforts touching ≥3 files or needing sequencing.
- Include verification strategy in reasoning mode, not just implementation steps.
- No global installs unless user-approved; prefer project-local tooling (`pnpm`).
- Preflight installs/tests by stating working directory and runtime path.
- Stop after 2 failed attempts; send blocked report (attempts, evidence, hypothesis, blocker, next step).
- Ask one focused question when ambiguity affects outcome.
- Avoid TODO comments without linked issues.
- When `tasks/lessons.md` exists, review before editing and add lessons after corrections.

## Subagent Invocation Policy
- Route by capability; default to `build` unless specialist behavior is required.
- Core capabilities: `GitHub Ops`, `Product Discovery`, `Architecture Decision`, `Phased Planning`, `Research`, `Test Validation`, `Test Repair`, `Security Review`, `Peer PR Review`, `Docs Maintenance`, `Prompt Engineering`, `Eval Design`, `RAG Engineering`.
- Optional aliases: `@gh-operator`, `@product-reviewer`, `@architect`, `@planner`, `@researcher`, `@tester`, `@debugger`, `@security-auditor`, `@pr-reviewer`, `@docs-maintainer`, `@prompt-engineer`, `@eval-designer`, `@rag-engineer`.
- If alias missing, execute capability manually (describe commands) instead of blocking.
- Use explicit `@subagent` mentions when specialist scope or strict format is needed.
- Run `pre-commit-gate` for self-review before committing large changes; use `Peer PR Review` capability for teammate PRs.

## Capability Model & Optional Aliases
- `Product Discovery` (`@product-reviewer`): validate nebulous ideas.
- `Architecture Decision` (`@architect`): ADR-style choices.
- `Phased Planning` (`@planner`): multi-step change breakdown.
- `Research` (`@researcher`): external/live docs.
- `Test Validation` (`@tester`): run targeted suites after changes.
- `Test Repair` (`@debugger`): diagnose failing tests.
- `Security Review` (`@security-auditor`): read-only review for auth/PII/payments.
- `Docs Maintenance` (`@docs-maintainer`): align README/changelog.
- `Prompt Engineering` (`@prompt-engineer`), `Eval Design` (`@eval-designer`), `RAG Engineering` (`@rag-engineer`).

## Capability Routing Matrix
| Scenario | Capability | Notes |
| --- | --- | --- |
| Ambiguous product direction | Product Discovery | Produces decision-ready brief |
| Feature touching >3 files | Phased Planning | Plan before coding |
| New architecture decision | Architecture Decision | ADR output |
| Tests failing already | Test Repair | Loop until green |
| Sensitive surface touched | Security Review | Run before merge |
| Need PR/CI updates | GitHub Ops | Use `gh` CLI |

## Capability Fallbacks
- If specialist agent unavailable, describe manual fallback (e.g., run tests via CLI, summarize results) and record assumption.
- Switch to command-driven workflow when auto-routing fails once.

## Execution Quality
- Choose the smallest correct change; avoid drive-by refactors.
- Fix root causes, not symptoms, unless user explicitly requests workaround.
- Perform elegance check for non-trivial work; prefer maintainable solutions.

## Definition of Done Contract
- Completion report MUST list: commands run, key results, what was verified vs not, residual risks, runtime/interpreter info, assumptions.
- Include before/after behavior notes for user-visible changes.

## Verification Protocol *(includes safety feature)*
- Provide proof (logs, screenshots, Read-tool output). If no automated test exists, create a temporary script or manual verification note.
- **Never read `.env` files or secrets.** Request sanitized inputs from user instead.
- Document verification gaps and propose next steps.

## Security Non-negotiables
- Do not commit secrets (`.env`, keys, tokens, credential JSON).
- Run secret scans before committing.
- Avoid `eval`/`exec` with untrusted input; no ad-hoc SQL concatenation.
- Sanitize prompt/PII examples before sharing. MUST protect clinical data.

## Git and PR Standards
- Use feature branches; no direct pushes to `main`/`master`.
- Commit format: `type(scope): description` under 72 chars.
- PRs close an issue via `closes #N` and cover a single concern; split when touching >3 unrelated areas.

## Scope-Control Rules
- No unrelated refactors inside focused PRs.
- Stop and re-plan when new evidence appears.
- Capture follow-ups as tasks/issues instead of expanding scope mid-PR.

## Critical Paths & Extra Review Triggers
- Sensitive modules: Clinical data parsing (Langchain workflows), user text input handling. Require `Security Review` when modifying these areas due to PII/HIPAA concerns.

## Validation Notes
- Missing test/typecheck commands: The project currently lacks explicit test scripts in `package.json`. These are marked as `<TBD>` per user's guidance. Verify with the team later and update this document.

## Tooling Lock
- Canonical package manager is `pnpm`. Do NOT use `npm` or `yarn`.

## References
specific constraints and deprecation notices.

## Agent Docs Reference & High-level Modularity Rules
Agents MUST consult the canonical modularity guide before making structural or multi-file changes:

- Primary source: `src/docs/MODULARITY.md` — read this file before adding features, moving code, or introducing new import paths.
- Secondary references: `src/docs/PROJECT_CONTEXT.md`, `src/docs/ARCHITECTURE.md`, `src/docs/DECISIONS.md`, `src/docs/SPEC.md`, `src/docs/PROMPTS.md`, `src/docs/README.md`.

High-level rules agents must enforce when producing or editing code:

- No cross-feature imports: a file in `features/*` must not import from another `features/*` folder. Shared code belongs in `src/lib/` or `src/types/`.
- All modality branching (audio/text/upload/etc.) is contained in `src/lib/langchain/inputAdapters.ts` — do not scatter `if modality === ...` across code.
- `src/lib/` is non-React infrastructure only: no JSX, no React hooks, and no imports from `features/`.
- `src/components/ui/` is generated shadcn/ui code and must not be hand-edited; add components with the shadcn CLI (`npx shadcn-ui@latest add ...`).
- `app/page.tsx` composes features and owns top-level state; it must not contain business logic or direct API calls beyond delegating to hooks like `useGeneration`.
- Types that cross feature boundaries live in `src/types/index.ts`; feature-local types stay in each feature's `types.ts`.

What agents should do when a requested change touches structure or multiple files:

1. Read `src/docs/MODULARITY.md` and `src/docs/PROJECT_CONTEXT.md` and summarise any relevant constraints in the plan.
2. Verify code changes do not violate the high-level rules above (use `grep`/`glob` to find cross-feature imports or misplaced files).
3. If a rule would be broken for a good reason, include a short justification in the change summary and add a TODO with a linked issue for later cleanup.

Agents must treat these docs as authoritative project rules and reference them in their implementation reasoning when relevant.
