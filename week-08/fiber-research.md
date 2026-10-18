# Week 8 Research — Fiber Payment Ops / Milestone Payments

**Status:** Research and no-fund FNN v0.9.1 invoice/dry-run demos completed; funded payment flow not tested
**Scope:** Study Fiber channels, invoices, routing, payment lifecycle, and the boundary between conditional payments and escrow  
**Decision status:** Candidate for discussion with Neon; not yet selected as the capstone

## 1. Research question

Can we build a small application that makes Fiber payments easier to integrate and operate—for example, by creating invoices, checking a route and fee before sending, tracking payment status, and linking payment to an off-chain milestone approval?

This is an independent Week 8 report. It builds on our previous work, but does not copy another participant's report or present proposed functionality as completed.

## 2. Executive summary

Fiber is a peer-to-peer payment and swap network built around off-chain channels secured and settled through CKB. A usable payment depends on node connectivity, channel state, routing, direction-specific liquidity, fees, and TLC expiry constraints.

In Week 3, we already ran two Fiber nodes, opened a direct Testnet channel, created a 1 CKB invoice, paid it, and verified the result. That established the basic direct-payment flow. The next useful question is what an application must do before and after a payment to make the experience dependable.

The current stable v0.9.1 RPC documentation exposes a promising integration surface:

- Create, parse, inspect, cancel, and settle invoices.
- Run a payment in dry_run mode to check whether a route can be built and estimate the fee before submitting it.
- Query payment sessions with statuses Created, Inflight, Success, or Failed, plus timestamps, errors, fees, preimage, and route history.
- Use Basic Multi-Path Payments (MPP) to split one payment session across multiple TLC attempts.

This suggests a practical candidate: **Fiber Payment Ops**, a small merchant or milestone-payment console that previews a Fiber invoice/payment, records a human approval, submits the payment only after approval, and tracks the Fiber result. The approval record is an application workflow; it must not be presented as Fiber escrow or an on-chain milestone condition.

## 3. What Fiber is

Fiber Network Node (FNN) is the reference node implementation of the Fiber Network Protocol. Fiber provides a peer-to-peer network for payments and swaps, supports CKB and configured UDT assets, and routes payments through payment channels. The project describes its current implementation as work in progress. Its official repository says PTLC and programmable conditional-payment application protocols remain roadmap work, while basic MPP is released. [Fiber repository and roadmap](https://github.com/nervosnetwork/fiber)

### 3.1 On-chain and off-chain responsibilities

~~~text
Open/accept channel
    → CKB on-chain funding
    → channel ready
    → TLC-based off-chain payments / optional multi-hop
    → cooperative or force close when needed
    → CKB on-chain settlement
~~~

Opening a channel requires an on-chain funding action. Once ready, payments update channel state off-chain. CKB remains the settlement layer if a channel closes. For a public CKB channel, the official manual describes a 99 CKB per-side reserve for occupied capacity and shutdown fees; that reserve cannot be spent in off-chain payments. [Fiber public-node manual](https://github.com/nervosnetwork/fiber/blob/v0.9.1/docs/public-nodes.md)

### 3.2 Connectivity, channel, route, and payment are distinct

A channel has an overall funding amount, but the amount a node can send depends on its current side of the balance. Each hop on a route must have enough liquidity and satisfy fee and TLC-expiry constraints.

Fiber's gossip graph shares channel presence and routing information, but not real-time balances. A route may therefore look possible while actual liquidity is insufficient. [Fiber glossary](https://github.com/nervosnetwork/fiber/blob/v0.9.1/docs/glossary.md)

- **Peer connection:** two nodes can communicate.
- **Channel readiness:** a channel exists and is usable.
- **Route availability:** the graph can produce a path for the amount and asset.
- **Payment success:** all required TLCs settle successfully.

An app should show these as separate states.

## 4. Invoice and payment lifecycle

Fiber invoices are generated and parsed by FNN. The protocol is inspired by BOLT 11 but uses Molecule serialization and Bech32m; Fiber invoices are not Lightning invoices. The prefix identifies the CKB network: fibt for Testnet and fibb for Mainnet. Invoices can contain amount, payment hash, timestamp/expiry, description, timeout, fallback address, and asset information. [Fiber invoice protocol](https://github.com/nervosnetwork/fiber/blob/v0.9.1/docs/specs/payment-invoice.md)

The v0.9.1 RPC describes this payment status progression:

~~~text
Created → Inflight → Success
                   └→ Failed
~~~

Created means the session exists but no TLC has been dispatched; Inflight means the first hop has been sent; Success means all related TLCs settled; Failed means the session ended unsuccessfully. An MPP session can include multiple TLC attempts. RPC results can expose fee, route history, timestamps, failure details, and—after success—the preimage. [Fiber v0.9.1 RPC documentation](https://github.com/nervosnetwork/fiber/blob/v0.9.1/crates/fiber-lib/src/rpc/README.md)

The send_payment RPC includes dry_run to check if a router can be built and determine the fee before sending. A candidate app flow is:

1. Parse the invoice and display network, asset, amount, description, and expiry.
2. Run a route/fee preflight.
3. Present the estimate for human approval.
4. Submit only after approval.
5. Query the payment session until a terminal result.
6. Store Fiber status separately from the application's approval/audit record.

A dry run is a point-in-time preflight, not a guarantee: route or liquidity conditions may change before submission. [Fiber RPC: send_payment and dry_run](https://github.com/nervosnetwork/fiber/blob/v0.9.1/crates/fiber-lib/src/rpc/README.md)

## 5. Hold invoice is not a complete escrow product

The v0.9.1 new_invoice RPC allows a caller to supply a payment hash without the preimage, creating a hold invoice. The TLC is held until the preimage becomes known; settle_invoice later stores the preimage. This primitive is documented in the stable release. [Fiber v0.9.1 RPC documentation](https://github.com/nervosnetwork/fiber/blob/v0.9.1/crates/fiber-lib/src/rpc/README.md)

It does not define who may approve a milestone, dispute handling, arbitration, deadlines, evidence rules, or an on-chain condition linking release to milestone completion. A service holding the preimage creates an application trust and key-management boundary. The upstream README still lists programmable conditional-payment protocols as roadmap work. [Fiber repository roadmap](https://github.com/nervosnetwork/fiber)

Thus **Milestone payments over Fiber** is feasible as an application workflow prototype, but the first version should be called **approval-gated payment using Fiber**, not trustless escrow. We need to validate who creates and holds the preimage and how timeout behavior works before relying on hold invoices.

## 6. What Week 3 already proved

The Week 3 report documents that we ran two Fiber v0.9.0 nodes on Windows, connected them directly, opened a Testnet channel, waited for ChannelReady, created a 1 CKB invoice, paid it, checked Success/Paid, and observed balances change from 400/0 to 399/1 CKB.

This proves the basic direct-payment flow worked in that environment at that time. It does not prove multi-hop routing, MPP, route preflight, hold invoices, failure recovery, application-level approval, or v0.9.1 behavior. The Week 3 node data and keys are out of scope and should not be reused or upgraded for this report.

## 7. Product candidate: Fiber Payment Ops

An application integrating Fiber needs to explain what happens before and after a payment. A basic Pay button hides wrong-network or expired invoices, route unavailability, estimated fees, in-flight states, route failures, and successful settlement.

A small merchant or milestone-payment console could:

1. Parse an invoice and show payment details.
2. Run dry_run and display route availability and estimated fee.
3. Ask a human to approve or reject.
4. Submit an approved payment through FNN RPC.
5. Track status, route, fee, timestamps, and failure details.
6. Keep a separate audit record with approver, milestone reference, time, and payment hash.
7. Explore hold-invoice behavior as a separate experiment, with its trust and timeout assumptions documented.

This adds to Week 3 by focusing on preflight, approval, payment observability, and failure handling instead of repeating one direct payment.

### Fit with prior CKBuilder work

- Week 3 provides experience with FNN, channels, invoices, payment, and balance inspection.
- Week 7 explored Proof-to-Pay and highlighted the need to distinguish approval, payment submission, and observed completion.
- A Fiber app can reuse that workflow learning while using off-chain Fiber payments as the rail.

**Candidate name:** Fiber Payment Ops — approval-gated merchant/milestone payments over Fiber.

This remains a research candidate. With Neon, we should decide whether the capstone emphasizes invoice/payment integration and lifecycle visibility, or milestone approval with clear limits around escrow and disputes.

## 8. Risks and open questions

1. **Liquidity:** a successful dry run does not guarantee a later payment.
2. **RPC compatibility:** v0.9.1 RPC docs say APIs are not stable and may change.
3. **RPC security:** FNN warns against exposing JSON-RPC to arbitrary machines; production should keep node RPC private behind a trusted backend.
4. **Version mismatch:** Week 3 used v0.9.0; this research checks v0.9.1 as stable. v0.10.0-rc1 is a prerelease; do not casually upgrade a node with live channels.
5. **Completion semantics:** Fiber Success is distinct from application approval and CKB channel settlement.
6. **Hold invoice trust:** identify who creates/keeps the preimage and who can settle; the primitive does not provide milestone arbitration.
7. **Funding cost:** the public Testnet guide's example uses 499 CKB funding to leave 400 CKB available after reserve, plus change and fees. A funded demo should be planned separately.
8. **Retry/idempotency:** test what remains queryable after retries and how an app avoids duplicate requests.

## 9. Proposed demo

### Phase A — isolated, no-fund RPC spike

Use a fresh Week 8 data directory and pinned FNN version. Do not read, copy, or modify Week 3 keys or databases.

- Verify the v0.9.1 Windows bundle and RPC methods.
- Start an isolated node only if configuration and key material are available without exposing secrets.
- Create and parse a local Testnet invoice.
- Inspect network, amount, expiry, and payment hash; then cancel the open invoice.
- Record exact versions, RPC results, and constraints.

This needs no channel or broadcast transaction. If safe isolation is unavailable, stop at official RPC schemas/test fixtures and report that no live node test occurred.

### Phase B — route and status prototype

With an already available, explicitly approved Testnet channel, run dry_run and record route/fee output. Only compare it with an actual payment if the channel and funds are intentionally available. Capture status transitions and include a failure case such as no valid route or expired invoice.

### Phase C — approval workflow

~~~text
Invoice parsed → dry-run estimate → human approval
              → submit payment → Inflight → Success / Failed
~~~

Keep the approval record separate from Fiber payment state. Treat hold invoices as a separate experiment after validating preimage custody and timeout behavior.

## 10. Local experiment

### Environment

- Official FNN and fnn-cli v0.9.1 Windows x86-64 release bundle.
- Fresh, isolated CKB Testnet runtime under week-08/fiber-demo/runtime/.
- Local RPC: 127.0.0.1:18327; P2P listener restricted to localhost:18328.
- Generated demo-only CKB key with no funds; restart password encrypted with Windows DPAPI for this Windows user.
- FNN node_info returned Testnet chain hash 0x10639e...e3f9606, version 0.9.1, and zero channels.
- No Week 3 node database or private key was read or reused.

The official native-node guide supports a pinned v0.9.1 Windows setup and documents its local RPC defaults. [Fiber v0.9.1 native-node guide](https://www.fiber.world/docs/quick-start/run-a-node/rust)

### Invoice lifecycle experiment

The repeatable script is week-08/fiber-demo/run-invoice-demo.ps1. It performs create → parse → get → cancel → verify against the local FNN JSON-RPC endpoint.

| Step | Observed result |
|---|---|
| Create | Testnet invoice prefix fibt; currency Fibt; amount 0x5f5e100 = 100,000,000 shannons = 1 CKB |
| Parse | Parsed currency and amount matched the requested invoice |
| Query | Initial invoice status Open |
| Cancel | cancel_invoice returned Cancelled |
| Verify | get_invoice returned final status Cancelled |
| Channel state | Zero channels |
| On-chain action | None; no transaction was broadcast |

### Route preflight experiment

The repeatable script is week-08/fiber-demo/run-dry-run-demo.ps1. It calls send_payment with dry_run=true for 1 CKB toward an official Testnet node.

Observed result: route construction failed with “Insufficient balance: max outbound liquidity 0 is insufficient, required amount: 100000000.” The node had zero channels. A follow-up list_payments query returned zero payment sessions. This is the expected outcome for a fresh node without outbound channel liquidity; dry_run did not dispatch a payment.

This is a useful product behavior: the app can distinguish “no route/liquidity” from a payment that was actually submitted. It does not yet validate success on a funded route or a multi-hop payment.

The first request with decimal amount/expiry values was rejected because this RPC expects unsigned integers encoded as 0x-prefixed hexadecimal strings. Repeating with 0x5f5e100 (amount) and 0xe10 (expiry) succeeded. This is a useful integration detail for client code and should be handled in an RPC adapter.

The demo prints only the invoice prefix, amount, currency, and statuses. It does not print or save the full invoice string or private key. The test invoice was cancelled immediately after parsing and status inspection.

### Reproduction

1. Run setup-runtime.ps1 once if runtime/ does not exist.
2. Start FNN with runtime/start-node.ps1.
3. In a second PowerShell window, run run-invoice-demo.ps1.
4. Stop FNN with Ctrl+C in the node window.

Together, the tests validate FNN startup, invoice creation/parsing/status/cancellation, dry-run route failure with zero outbound liquidity, and that dry_run created no payment session. They do not validate successful routing over a funded channel, MPP, hold-invoice settlement, or an actual payment.

## 11. Conclusion

Fiber is the strongest Week 8 research direction given our prior hands-on result and your interest. The most credible small capstone candidate is **Fiber Payment Ops**, with milestone approval as a possible use case—not a claim that Fiber already provides escrow.

The no-fund invoice lifecycle and dry-run route-failure checks are complete. The next experiment, if we choose to pursue it, is to test preflight and payment status over a funded route; that requires a separate Testnet funding/channel plan. We can discuss capstone scope with Neon using these concrete findings.

## Sources

- [Fiber repository, roadmap, maturity, and installation guidance](https://github.com/nervosnetwork/fiber)
- [Fiber v0.9.1 RPC documentation](https://github.com/nervosnetwork/fiber/blob/v0.9.1/crates/fiber-lib/src/rpc/README.md)
- [Fiber v0.9.1 public-node manual](https://github.com/nervosnetwork/fiber/blob/v0.9.1/docs/public-nodes.md)
- [Fiber v0.9.1 invoice protocol](https://github.com/nervosnetwork/fiber/blob/v0.9.1/docs/specs/payment-invoice.md)
- [Fiber v0.9.1 glossary](https://github.com/nervosnetwork/fiber/blob/v0.9.1/docs/glossary.md)
- [Fiber v0.9.1 native-node quickstart](https://www.fiber.world/docs/quick-start/run-a-node/rust)
- [Fiber releases](https://github.com/nervosnetwork/fiber/releases)

**Research checked:** 18 October 2026  
**Local references:** ckb_weekly_report_w3.md, ckb_weekly_report_w7.md, and the Week 8 DOB research note.



