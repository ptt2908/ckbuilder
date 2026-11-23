# Builder Track Weekly Report — Week 7

**Reporting Period:** 05 October - 11 October 2026\
**Participant:** Pham Tan Thinh

---

## Courses and Topics Completed

### 1. Frontend Quality and Deployment Preparation

Continued improving the Week 6 xUDT Token Manager before deployment:

- Established and expanded automated testing with Vitest and Testing Library.
- Added unit, integration, and UI-flow coverage for utilities, token registry, transaction history, and critical user interactions.
- Implemented a persistent, network-aware multi-token registry, including migration support for older localStorage entries.
- Prepared environment-based configuration for the CKB network, RPC endpoint, and explorer URL.
- Added an `.env.example`, updated project documentation, and created a GitHub Actions frontend CI workflow.

**Scope note:** Deployment preparation was completed, but the application was not deployed during Week 7.

### 2. Rust Fundamentals

Practiced core Rust concepts through a standalone Cargo project:

- Variables, mutability, primitive types, functions, conditionals, loops, pattern matching, enums, and collections.
- Ownership, move semantics, borrowing, mutable references, slices, and basic lifetimes.
- Structs, data-carrying enums, `Option`, `Result`, error propagation with `?`, and pattern matching.
- Applied these concepts in a sensor telemetry analyzer with calibration, input validation, summary statistics, error handling, and packet-frame decoding.

### 3. Proof-to-Pay Technical Research

Researched CKB transaction and Script concepts relevant to a proposed milestone-based payment application:

- CKB Cell structure and occupied-capacity considerations.
- The roles of Lock Scripts and Type Scripts.
- The limits of combining multisig authorization with `since` timelocks for escrow.
- The distinction between UI approval, transaction broadcast, and on-chain confirmation.
- Trade-offs between direct payment after approval and a custom escrow Script.

The research recommends using off-chain agreement/evidence management with direct CKB payment after explicit client approval as the initial MVP baseline. This approach is simpler to implement, but it is **not escrow and does not guarantee payment to the provider**. Custom escrow Script development remains a separate research direction.

---

## Exercises and Practical Work

### 1. xUDT Token Manager

Completed the following engineering work in `week-06/frontend`:

- Added unit and integration tests and covered critical UI flows.
- Implemented persistent multi-token registry behavior with network-aware token identity.
- Prepared configurable network settings and a CI workflow for linting, tests, type checking, and production builds.

**Key implementation commits:**
- `707f35b` — `test: establish Vitest testing foundation`
- `32444ed` — `fix: resolve lint issues and guard balance refresh races`
- `7f4b3d0` — `test: add amount and hex utility unit tests`
- `4f93eca` — `test: add token registry and transaction history integration tests`
- `a53b469` — `test: cover critical UI flows and validate token amounts`
- `fefbf9e` — `feat: add network-aware multi-token registry`
- `96846a9` — `chore: prepare frontend for deployment`

### 2. Rust Fundamentals Project

Created and expanded `week-07/rust-fundamentals` as a standalone Cargo project. The exercises progress from basic syntax to ownership, error handling, and a practical sensor telemetry analyzer.

**Key implementation commits:**
- `52cd89d` — `learn: add Rust fundamentals exercises`
- `5222ca8` — `learn: add Rust ownership and borrowing exercises`
- `70c5958` — `learn: add Rust types and error handling exercises`
- `6a5cdb9` — `learn: add Rust sensor telemetry analyzer`

### 3. Proof-to-Pay Research Document

Created `docs/technical-research.md` in the separate `proof-to-pay` repository. The document compares three implementation directions, records risks and unresolved decisions, and recommends a lower-risk MVP baseline.

- Commit: `cc96ac9` — `docs: add Proof-to-Pay technical research`
- Scope remained documentation-only; no application code, dependencies, contracts, or deployment were added.

---

## Verification Results

### Week 6 Frontend

- **Lint:** Passed with 0 errors and 0 warnings.
- **Automated tests:** 6 test files passed; 43 tests passed.
- **TypeScript:** `tsc -b` passed with no errors.
- **Production build:** `vite build` completed successfully.

### Rust Fundamentals

- **Formatting:** `cargo fmt --check` passed.
- **Linting:** `cargo clippy --all-targets --all-features -- -D warnings` passed with no warnings or errors.
- **Tests:** 20 unit tests passed.
- **Execution:** `cargo run` completed successfully.

### Repository State

- The main `ckbuilder` repository has a clean working tree, with 11 Week 7 commits ahead of `origin/main`. These commits have **not been pushed**.
- The separate `proof-to-pay` repository contains the technical research in commit `cc96ac9`; its working tree is clean.
- No live deployment was performed.

---

## Key Learnings

1. **Automated tests help protect existing behavior.** Unit, integration, and UI-flow tests provide checks across different layers before further development or deployment.
2. **Network identity must be represented explicitly in token registries.** Persisted token entries need network-aware identity and migration behavior to avoid mixing assets from different networks.
3. **Rust ownership and borrowing shape safe data access.** Practicing references, slices, lifetimes, `Option`, and `Result` helped connect language fundamentals to a small data-processing task.
4. **CKB authorization and transaction state are separate concerns.** A user action in the UI does not itself authorize or confirm a blockchain transaction.
5. **A timelock alone does not define a complete escrow policy.** Release, refund, authorization, timeout, and non-response cases must all be considered before designing a custom escrow Script.

---

## Challenges and Open Questions

- The initial Proof-to-Pay MVP does not protect a provider from a client who refuses to pay after receiving the work.
- A secure custom escrow design needs explicit release and refund authorization rules, output validation, and a defined timeout policy.
- JoyID/CCC transaction assembly involving custom escrow inputs has not yet been tested.
- Deployment configuration and CI preparation are complete, but a live deployment remains future work.

---

## Plan for Next Week — Week 8

- Define the Proof-to-Pay MVP architecture and data flow before implementation.
- Implement the one-milestone agreement and evidence workflow.
- Integrate JoyID and direct CKB payment after explicit client approval.
- Track transactions from submission through on-chain confirmation.
- Test validation, error states, and persistence boundaries between off-chain application data and on-chain settlement.
- Keep custom escrow Script work outside the main MVP path until its authorization and timeout design is better defined.
