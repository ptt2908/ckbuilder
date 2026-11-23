# Builder Track Weekly Report — Week 8

**Reporting period:** 12 - 18 October 2026   
**Participant:** Pham Tan Thinh  
**Program:** CKB Builder Track

---

## 1. Week 8 Overview

Week 8 was used to research and compare three possible capstone directions before implementation: **DOB Studio / Decoder Explorer**, **milestone payments over Fiber**, and a **NervosDAO Companion**. Each direction was studied independently and paired with a small demo or technical spike where practical.

The research builds on the work from Weeks 1–7. Week 3 established hands-on experience with Fiber channels and a successful 1 CKB Testnet payment. Weeks 4–6 developed CKB application skills with CCC, JoyID, xUDT, transaction tracking, and a modular React/TypeScript application, alongside exploration of Spore. Week 7 examined Proof-to-Pay and identified the distinction between application approval, payment submission, and on-chain confirmation.

After reviewing the candidate directions and comparing them against the intended user-facing product, the selected capstone is:

> **ReuseLoop — Reusable Packaging Return System**

ReuseLoop will record and verify the lifecycle of reusable packaging, including a workflow in which an item is borrowed at one point and returned at another. The core challenge is to model and validate item state transitions, authorized actions, and transaction history on CKB. The initial demonstration will use simulated return points on CKB Testnet; real-world store integration is not a requirement.

The Week 8 research remains valid as technical groundwork. **DOB/Spore and Fiber are planned as potential extensions for Week 11 or Week 12**, after the core borrow-and-return workflow is working and tested. They are not prerequisites for the initial MVP. NervosDAO Companion remains a separately researched utility and is not part of the current ReuseLoop scope.

No ReuseLoop application implementation was started during Week 8. Week 9 will focus on product specification, state-machine design, architecture, and a small technical feasibility test before the main implementation begins.

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
| DOB Studio / Decoder Explorer | Host-side DOB/0 sample test passed and returned expected traits. | RISC-V execution inside CKB VM, decoder provenance, and sandboxing. | Useful protocol research. DOB/Spore may be considered as a ReuseLoop extension, but it is not required for item identification in the MVP. |
| Proof-to-Pay / Fiber | FNN v0.9.1 invoice lifecycle and no-route preflight are reproducible; Week 3 separately demonstrated a funded payment. | Funded channel/liquidity plan and correct payment-state handling. | Fiber may support a later payment or inter-location settlement extension if it adds clear value to ReuseLoop. |
| NervosDAO Companion | Read-only Testnet headers, DAO field decoding, epoch comparison, and a hypothetical estimate ran successfully. | Real wallet-cell discovery and accurate position tracking. | Useful CKB utility, but it does not directly solve the reusable-packaging lifecycle problem and is excluded from ReuseLoop's current scope. |
| **ReuseLoop** | Selected after comparing the capstone directions and reviewing potential overlap with existing CKB projects. | Correct Cell/state-transition design, authorization, and end-to-end verification. | **Selected capstone:** a user-facing reusable packaging borrow-and-return application, including return at a different point. |

The capstone decision prioritizes a concrete user-facing workflow rather than integrating protocols for their own sake. ReuseLoop's differentiating workflow is the traceable lifecycle of a reusable item and the ability to confirm its return at a point different from where it was borrowed.

The project will use CKB Cells, Transactions, and appropriate Scripts as the on-chain foundation, with CCC/JoyID for wallet connectivity and transaction signing where appropriate. QR codes will provide a convenient way to identify or look up an item; a QR code itself is not treated as proof that a physical return occurred.

**Extension strategy:** the core MVP comes first. The plan is to work on both DOB/Spore and Fiber during Week 11 or Week 12, provided the core workflow is stable enough to protect the final deliverable. DOB could provide a digital representation or collectible identity for an item, while Fiber could support a genuine payment/settlement flow between participants or locations. Each extension will have a bounded implementation target and its own verification criteria; if integration risks threaten the core MVP, unfinished parts will be documented as prototypes rather than presented as completed capabilities. NervosDAO Companion is not planned for integration.

## 5. High-Level Plan for Weeks 9–12

This is the proposed plan for the selected ReuseLoop capstone. The plan prioritizes the smallest verifiable end-to-end workflow first, then considers DOB/Spore and Fiber as extensions in Week 11 or Week 12.

| Week | Focus | Proposed deliverables |
|---|---|---|
| **Week 9 — Scope and design** | Define target users, item lifecycle, roles, functional requirements, acceptance criteria, and threat boundaries. Design the state machine and decide how Cells represent item state. Set up the repository and Testnet development configuration. Run a small feasibility spike for creating, consuming, and recreating the relevant Cell/state. | Capstone brief; requirements and architecture docs; state-transition diagram; transaction/data model; risk list; test plan; initialized repository and environment. |
| **Week 10 — Core CKB lifecycle** | Implement item identification and the borrow/return transaction flow. Model the issuing point, borrower, and receiving point. Validate authorized transitions and handle invalid or duplicate requests. Start unit/integration tests before building out the UI. | Working core transaction flow in a suitable test environment and, where feasible, CKB Testnet; tests for valid transitions, invalid permissions, and stale/duplicate state. |
| **Week 11 — User-facing MVP and extension assessment** | Integrate React/TypeScript with CCC/JoyID. Build the item view, QR lookup, borrow action, return confirmation at a different point, current-state view, and transaction history. Test the full A-to-B flow. If the core flow is stable, begin bounded DOB/Spore and Fiber integration work in parallel, keeping each extension's scope small. | End-to-end ReuseLoop MVP; core test results; decision and proof-of-concept for optional DOB/Spore and Fiber extensions. |
| **Week 12 — Verification, optional extensions, and demo** | Fix core issues and test error paths. Continue DOB/Spore and Fiber integration only after the core acceptance criteria are satisfied; verify each extension independently. For DOB, verify the chosen Spore/DOB flow and its relationship to item data. For Fiber, verify invoice, liquidity/preflight, explicit user confirmation, and actual payment status; keep payment status separate from item-return status. Finalize documentation and demo. | Verified MVP; test report; setup instructions; architecture and limitations; demo script/evidence; optional DOB/Fiber functionality only to the extent actually implemented and verified. |

### Proposed ReuseLoop MVP workflow

1. An operator creates or registers a reusable item and its identifier.
2. The application displays the item's current state and QR-based lookup.
3. An authorized point records the handoff to a borrower.
4. The borrower returns the item at a receiving point that may differ from the issuing point.
5. The receiving point confirms receipt through an authorized action.
6. The application reads the updated state and transaction history from CKB-related data sources.

The exact state machine will be finalized in Week 9. A simple initial model may use `AVAILABLE → BORROWED → AVAILABLE`, with the receiving point's signed/authorized confirmation representing the return. An `INSPECTION` state can be added only if a clear inspection rule is required. The design must not allow a borrower to unilaterally certify that the receiving point physically accepted the item.

### Proposed end-of-capstone acceptance criteria

1. An item has a stable identifier and a queryable current state.
2. The application can demonstrate borrowing at Point A and return confirmation at Point B.
3. Only authorized actions can perform the defined state transitions.
4. Invalid, stale, or duplicate state-transition attempts are handled and tested.
5. The application displays transaction/state history without presenting unconfirmed submissions as successful.
6. The frontend supports the core workflow and wallet signing as required by the chosen transaction architecture.
7. Documentation distinguishes on-chain state and transaction evidence from off-chain display data and physical-world claims.
8. Optional DOB/Spore or Fiber functionality is included only if its actual behavior has been implemented and verified; neither extension is required to pass the core MVP.

## 6. Key Learnings

1. **Product workflow should drive protocol selection.** A CKB capstone should solve a concrete user problem; DOB, Fiber, and NervosDAO should be used only when they add a clear capability.
2. **Application state and on-chain transaction state are not interchangeable.** A UI action or submitted transaction must not be treated as complete until the relevant state change is verified.
3. **CKB's Cell model requires explicit state-transition design.** Transaction structure and scripts must enforce the intended rules; the Cell model alone does not implement the application's complete business logic.
4. **Physical-world events need authorized confirmation.** A QR code identifies an item but does not independently prove that a reusable item was physically returned.
5. **Fiber requires real payment-path testing.** Invoice parsing and preflight are useful but do not guarantee later payment success; a successful integration must handle channel liquidity and payment-session states.
6. **DOB rendering and data provenance are separate concerns.** A rendered DOB does not by itself prove the truth of the physical item's lifecycle data.
7. **Scope control improves delivery confidence.** ReuseLoop's borrow-and-return lifecycle is the MVP; DOB/Spore and Fiber are both planned extensions for Week 11/12, subject to core progress and independent verification.

## 7. Challenges and Open Questions

- **Cell/state model:** decide which item data belongs in a Cell, which fields are immutable, and how each valid transition is authorized.
- **Return authorization:** define which identity can confirm the return at Point B and how the app handles a return submitted by an unauthorized participant.
- **Physical-to-digital trust boundary:** CKB can validate transaction rules, but it cannot independently observe whether a physical package changed hands. The MVP must state which participant attests to the return.
- **State discovery and history:** choose a reliable approach to query current item state and transaction history, and document any indexer or off-chain lookup dependency.
- **Testnet transaction lifecycle:** test pending, rejected, stale-input, and failed transactions rather than relying only on UI state.
- **Optional DOB/Spore extension:** confirm whether it provides useful item identity or a user-facing feature beyond a QR and regular item record. The earlier DOB/0 host-side test did not establish successful RISC-V execution inside CKB VM.
- **Optional Fiber extension:** decide the exact payment use case before integration. A funded channel/liquidity plan is needed for an actual successful payment demo; preflight alone is not proof of payment.
- **Schedule risk:** Week 11/12 extension work must not delay the core borrow/return acceptance criteria. If time is limited, deliver the verified core MVP and document extension experiments honestly.
- **NervosDAO Companion:** remains outside the current ReuseLoop scope because it does not directly support the core packaging lifecycle.

## 8. Sources and Related Work

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

**Week 8 outcome:** Three candidate directions—DOB Studio, Proof-to-Pay over Fiber, and NervosDAO Companion—were researched and paired with small experiments. The selected Week 9–12 capstone is **ReuseLoop — Reusable Packaging Return System**. Week 8 experiments remain useful technical groundwork: DOB/Spore and Fiber are planned extensions for Week 11 or Week 12, after the core borrow-and-return workflow is working and verified. NervosDAO Companion is not part of the current capstone scope. The updated plan is a working proposal and may be refined against program requirements and mentor feedback.

