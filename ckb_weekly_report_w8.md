# Builder Track Weekly Report — Week 8

**Reporting period:** 12 - 18 October 2026   
**Participant:** Pham Tan Thinh  
**Program:** CKB Builder Track

---

## 1. Week 8 Overview

Week 8 was used to research and compare three possible capstone directions before starting implementation: **DOB Studio / Decoder Explorer**, **milestone payments over Fiber**, and a **NervosDAO Companion**. Each direction was studied independently and paired with a small demo or technical spike where practical.

The research builds on the work from Weeks 1–7. Week 3 established hands-on experience with Fiber channels and a successful 1 CKB Testnet payment. Weeks 4–6 developed CKB application skills with CCC, JoyID, xUDT, Spore, transaction tracking, and a modular React/TypeScript application. Week 7 examined Proof-to-Pay and identified the distinction between application approval, payment submission, and on-chain confirmation, as well as the limits of a direct-payment MVP that is not escrow.

After comparing the Week 8 candidates, the direction selected for discussion with Neon is:

> **Proof-to-Pay: Approval-Gated Milestone Payments over Fiber**

This is a proposed capstone direction, not yet an approved or implemented project. The Week 8 work remained research and small demos; no capstone application was started. An English summary message was drafted for Neon but has not been sent as of this report.

## 2. Week 8 Objectives

- Research two to three possible capstone directions that build on prior CKB Builder work.
- Use official protocol and implementation sources, while treating other participants’ reports as references rather than copied material.
- Run small experiments to separate verified behavior from assumptions.
- Compare technical fit, user value, implementation risk, and dependencies.
- Select a direction to present to Neon and outline a possible Week 9–12 plan.

## 3. Research and Practical Work

### 3.1 DOB Studio / Decoder Explorer

**Research question:** Could a small tool help creators inspect DOB/0 DNA, pattern offsets, decoder configuration, and decoded traits before minting or integrating with a Spore Cluster?

The research reviewed the DOB/0 data model and decode flow: DNA is supplied by an individual DOB, a Cluster carries shared pattern metadata, and a decoder interprets the DNA into traits. The product idea is a preview and learning tool, not a credential issuer or a claim that a rendered DOB is authentic.

**Local experiment:** The official DOB/0 library's host-side unit check passed: **1 passed, 0 failed**. The sample returned the expected first traits (Name `Ethan`, Age `23`, Score `136`) and additional DNA/URL/timestamp fields. This confirmed host-side library behavior for that sample. It did not establish that the compiled RISC-V decoder runs successfully inside CKB VM.

**Unresolved:** The RISC-V-in-VM path remains unresolved. The VM runner's `asm` mode could not be built without Clang, and interpreter execution stopped on an instruction not supported by the tested configuration. No wallet was connected and no Cluster or Spore transaction was created.

**Assessment:** DOB Studio connects well to previous Spore work and provides a useful protocol-learning tool. Decoder sandboxing, binary provenance, and VM compatibility add technical uncertainty. It is less aligned with the current preference to focus the capstone on Fiber.

Research note: [`week-08/dob-studio-research.md`](./week-08/dob-studio-research.md)

### 3.2 Fiber Payment Ops / Proof-to-Pay

**Research question:** Can an application make a Fiber payment workflow more dependable by checking an invoice and route before payment, requiring a human decision, and tracking the final result? Could this support a milestone-approval use case?

Fiber is a peer-to-peer payment and swap network. Channels are funded and eventually settled through CKB, while individual channel payments are handled off-chain. A peer connection, a ready channel, an available route, and a successful payment are separate states. The sender's usable amount also depends on directional liquidity.

The v0.9.1 RPC surface supports invoice creation/parsing, payment preflight with `dry_run`, payment submission, and payment-session queries. Payment status progresses through `Created`, `Inflight`, and either `Success` or `Failed`. A dry run checks whether a route can be constructed and estimates the fee at that point in time; it is not a guarantee that a later payment will succeed. [Fiber v0.9.1 RPC documentation](https://github.com/nervosnetwork/fiber/blob/v0.9.1/crates/fiber-lib/src/rpc/README.md)

**Local experiment:** An isolated FNN v0.9.1 Testnet runtime was used with a demo-only, unfunded key and zero channels. The repeatable invoice demo created and parsed a 1 CKB Testnet invoice, inspected it, cancelled it, and confirmed the final status was `Cancelled`. The route preflight demo attempted a 1 CKB payment with `dry_run=true`; it returned insufficient outbound liquidity because the node had no channels. A follow-up query showed no payment session was created. No payment was sent and no transaction was broadcast from this Week 8 demo.

This result validates an important product distinction: **no route/liquidity** is different from a payment that was submitted and later failed. It also leaves funded routing and successful payment status to be tested in a future, intentionally funded setup. Week 3 had already demonstrated a successful 1 CKB Testnet Fiber payment over a 400 CKB channel, but that is prior evidence and not a successful result from this isolated Week 8 runtime.

The official public-node manual describes a 99 CKB reserve on each side of a public channel for settlement and shutdown costs. A funded capstone demo therefore needs a deliberate Testnet funding/channel plan. [Fiber public-node manual](https://github.com/nervosnetwork/fiber/blob/develop/docs/public-nodes.md)

**Product candidate:** Proof-to-Pay can use Fiber as its payment rail while the application manages milestone evidence and approval. The app should require explicit payer confirmation after approval, then track Fiber's payment result. Approval is an application decision; it is not a Fiber contract condition. The official Fiber repository lists programmable conditional payment as a roadmap item, so the MVP should not be described as trustless escrow. [Fiber project and roadmap](https://github.com/nervosnetwork/fiber)

Research note: [`week-08/fiber-research.md`](./week-08/fiber-research.md)

### 3.3 NervosDAO Companion

**Research question:** Could a companion help CKB holders understand their NervosDAO positions, compensation estimate, and the separate prepare/withdraw steps?

RFC #0023 describes a deposit cell, a two-phase withdrawal, a minimum 180-epoch lock, and compensation based on the DAO accumulated rate. The calculation applies to capacity excluding the cell's occupied capacity. If a holder misses an eligible withdrawal point, a later 180-epoch period applies. [Nervos RFC #0023](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md)

**Local experiment:** A PowerShell demo read the current Testnet tip header and a historical header through the public CKB JSON-RPC endpoint, parsed the 32-byte `dao` field, compared the epoch maturity point, and calculated compensation for a hypothetical cell. In the recorded run on 19 October, the example assumed a 10,000 CKB cell with 100 CKB occupied capacity and reported approximately **26.46964824 CKB** illustrative compensation. It treated the current tip as the hypothetical phase-1/prepare header. A real withdrawing cell must use its actual prepare inclusion header and actual occupied capacity.

The demo did not query a wallet, discover real DAO cells, construct transactions, or deposit/withdraw CKB. It verified header retrieval and a hypothetical calculation only.

**Assessment:** This is a focused CKB-native utility, but a real portfolio companion needs reliable live-cell discovery, source-header lookup, and exact maturity tracking. It is less aligned with the selected interest in Fiber payments.

Research note: [`week-08/nervosdao-companion-research.md`](./week-08/nervosdao-companion-research.md)

## 4. Candidate Comparison and Direction

| Candidate | What Week 8 validated | Main open risk | Current assessment |
|---|---|---|---|
| DOB Studio / Decoder Explorer | Host-side DOB/0 sample test passed and returned expected traits. | RISC-V execution inside CKB VM, decoder provenance, and sandboxing. | Good Spore learning tool; not the preferred capstone direction now. |
| Proof-to-Pay over Fiber | FNN v0.9.1 invoice lifecycle and no-route preflight are reproducible; Week 3 separately demonstrated a funded payment. | Funded channel/liquidity plan; approval workflow is application-level, not escrow. | Best match for prior Fiber work and the participant's current interest. Selected to discuss with Neon. |
| NervosDAO Companion | Read-only Testnet headers, DAO field decoding, epoch comparison, and hypothetical estimate ran successfully. | Real wallet-cell discovery and accurate position tracking. | Useful CKB utility, but narrower fit for the chosen direction. |

The decision refines the Week 7 Proof-to-Pay baseline. Week 7 compared direct CKB payment after approval with custom escrow work. Week 8 adds a different payment rail: **Fiber payments over CKB channels**, while retaining the Week 7 boundary that application approval, payment submission, and confirmed payment are not interchangeable. This change requires Neon’s feedback and a refreshed technical specification before implementation.

## 5. Proposed Capstone — Proof-to-Pay over Fiber

### 5.1 Problem and users

Small teams, freelance projects, or community grants may need a clear way to submit work evidence, approve a milestone, and pay the recipient without treating a payment-channel invoice as an escrow agreement.

- **Payer/client:** defines the milestone, reviews evidence, and explicitly authorizes payment.
- **Recipient/provider:** submits evidence and provides a Fiber invoice for the approved amount.
- **Reviewer:** may be the client in the MVP; separate reviewers can be considered later.

### 5.2 Proposed MVP flow

1. The payer creates one milestone with an amount, recipient, and acceptance criteria.
2. The provider submits off-chain evidence.
3. The payer approves or rejects the evidence, with a reason for a requested revision.
4. After approval, the provider supplies a Fiber invoice.
5. The payer reviews the invoice's network, amount, and expiry. The app runs a Fiber `dry_run` and displays route/fee results when available.
6. The payer explicitly confirms before the app submits `send_payment` through FNN.
7. The app tracks the payment using Fiber's payment status and records a receipt/reference for the milestone.

The UI and data model should keep two state machines separate:

~~~text
Milestone: Draft → Evidence Submitted → Approved / Changes Requested
Payment:   Invoice Ready → Preflight → User Confirmed → Created → Inflight → Success / Failed
~~~

The app must not mark a milestone paid merely because it was approved, a transaction/payment request was submitted, or a preflight succeeded. A dry run is a point-in-time route check, not a reservation of liquidity.

### 5.3 Product boundary

**Included in the initial MVP:**

- One payer, one provider, one CKB-denominated milestone at a time.
- Evidence submission and explicit approval/rejection.
- Fiber invoice inspection, preflight, payer confirmation, and status tracking.
- Clear records showing which facts are off-chain application data and which are Fiber payment results.

**Out of scope unless Neon recommends otherwise:**

- Trustless escrow, automatic conditional release, arbitration, or refund enforcement.
- Custom CKB Script for holding or releasing funds.
- Marketplace, reputation system, multiple approver quorum, multiple assets, and multi-milestone project management.
- Putting evidence files or private work details on-chain.

A hash of an approved receipt or payment reference anchored in a CKB cell/transaction could be a stretch goal if program criteria require an application-level on-chain artifact. It should not be allowed to delay the working Fiber payment flow, and its privacy and storage cost need review.

## 6. High-Level Plan for Weeks 9–12

This is a planning proposal pending feedback from Neon and confirmation of capstone requirements.

| Week | Focus | Proposed deliverables |
|---|---|---|
| **Week 9 — Scope and design** | Present the concept to Neon; confirm user/problem, MVP boundary, and whether Fiber is sufficient as the primary CKB integration. Choose the repository and decide the two-party data/persistence approach. Define roles, workflow states, payment state mapping, threat boundaries, and a test/demo plan. | Approved or revised capstone brief; architecture and sequence diagrams; data model/API outline; risks and acceptance criteria; isolated Fiber development environment plan. |
| **Week 10 — Milestone workflow** | Build the one-milestone agreement, evidence submission, and review/approve/reject flow. Implement shared persistence suitable for payer and provider rather than relying on one browser's localStorage as shared state. Add validation and an audit trail for application decisions. | Usable end-to-end off-chain workflow; one payer and one provider can see the same milestone state; payment step remains gated on approval. |
| **Week 11 — Fiber integration** | Add a backend adapter to the FNN RPC, keeping node RPC and credentials out of an untrusted browser. Parse and validate invoices; run `dry_run`; require a separate payer confirmation; submit the payment; poll/query the payment session and display `Created`, `Inflight`, `Success`, or `Failed`. Exercise errors such as expired/wrong-network invoices and no route/liquidity. | Integrated Fiber payment flow with clear preflight and status handling; funded Testnet success if an approved channel/funding setup is available, otherwise a documented blocked boundary with no false success claims. |
| **Week 12 — Verification and presentation** | Review state transitions and authorization; test approval/rejection, wallet/node cancellation, RPC/network errors, payment failure, refresh/recovery, and duplicate-submit handling. Fix high-priority issues, prepare setup instructions and a demo script, and record limitations. Decide whether an on-chain receipt is feasible only after the core flow works. | Capstone MVP, verification results, README/architecture notes, demo evidence, final presentation, and a list of remaining risks or future work. |

### Proposed end-of-capstone acceptance criteria

1. A payer and provider can complete one milestone workflow and see the same persisted state.
2. Evidence can be submitted, reviewed, approved, or returned for changes.
3. A payment action is unavailable until approval and requires explicit payer confirmation.
4. The app validates invoice details and shows preflight results without claiming a route is guaranteed.
5. Payment status comes from Fiber and remains distinct from milestone approval and application logs.
6. RPC access and signing material are not exposed to arbitrary browser clients.
7. The demo and documentation state clearly that the product is not escrow and does not force the client to pay.

## 7. Key Learnings

1. **A payment workflow has independent application and network states.** Approval does not equal payment; submission does not equal completion.
2. **A route check is useful but temporary.** Fiber `dry_run` can reveal no-route or fee conditions, but liquidity can change before sending.
3. **Fiber interest is grounded in prior work.** Week 3 already exercised a funded Fiber channel, while Week 8 examined invoice lifecycle, preflight, and failure observability.
4. **The capstone should solve a concrete workflow around Fiber.** A generic RPC wrapper may not provide enough product value; milestone evidence and review give the integration a specific user problem.
5. **Clear boundaries prevent misleading claims.** The first version coordinates approval and payment but is not escrow, arbitration, or a trustless conditional-payment protocol.
6. **Small demos expose integration constraints early.** The isolated no-fund route test made the liquidity dependency visible before capstone implementation.

## 8. Challenges and Open Questions

- A funded Fiber test requires a channel and directional liquidity; the Week 8 isolated node had neither.
- A shared two-party workflow requires shared persistence and role handling; browser-only storage would not synchronize two participants.
- FNN RPC should be accessed through a trusted application boundary, not exposed directly to arbitrary browsers.
- The current proposal uses off-chain evidence and application-managed approval. Its audit guarantees and dispute process must be described accurately.
- Whether to add a CKB on-chain receipt depends on Neon’s expectations and the time left after the Fiber core flow.
- Fiber conditional-payment roadmap items should not be treated as available MVP functionality.

## 9. Sources and Related Work

### Internal reports and research notes

- [`ckb_weekly_report_w1.md`](./ckb_weekly_report_w1.md) through [`ckb_weekly_report_w7.md`](./ckb_weekly_report_w7.md)
- [Week 8 research README](./week-08/README.md)
- [DOB Studio / Decoder Explorer research](./week-08/dob-studio-research.md)
- [Fiber Payment Ops / milestone payments research](./week-08/fiber-research.md)
- [NervosDAO Companion research](./week-08/nervosdao-companion-research.md)


### Official technical sources

- [Fiber repository and roadmap](https://github.com/nervosnetwork/fiber)
- [Fiber v0.9.1 RPC documentation](https://github.com/nervosnetwork/fiber/blob/v0.9.1/crates/fiber-lib/src/rpc/README.md)
- [Fiber public-node manual](https://github.com/nervosnetwork/fiber/blob/develop/docs/public-nodes.md)
- [Nervos RFC #0023 — DAO deposit and withdraw](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md)
- [CKB system DAO script](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/dao.c)

---

**Week 8 outcome:** Three research directions were documented and paired with small experiments. Proof-to-Pay over Fiber was selected as the preferred direction to present to Neon. The Week 9–12 plan remains provisional until feedback is received.

