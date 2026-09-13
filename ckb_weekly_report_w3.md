# CKBuilders Week 3 — Payment Channels on CKB

## 1. Overview

Week 3 focused on understanding **payment channels on CKB**, with hands-on exploration of two major approaches:

- **Fiber Network** — a payment-channel network designed for fast, low-cost off-chain payments on CKB.
- **Perun** — a payment-channel protocol implemented through CKB smart contracts.

The main objective was to understand how payment channels reduce the need for frequent Layer 1 transactions while maintaining the security and settlement capabilities of CKB.

The practical work focused primarily on **Fiber**, where a two-node payment channel was created and used to complete a real 1 CKB testnet payment. For **Perun**, the work focused on preparing the development environment, building the CKB contracts, and running the available test suite.

---

# 2. Payment Channel Fundamentals

## 2.1 Concept

A payment channel allows participants to perform multiple transactions **off-chain** after establishing an initial on-chain channel.

Instead of submitting every payment directly to CKB Layer 1:

```text
Traditional payment:

User A → CKB Layer 1 → User B
User A → CKB Layer 1 → User B
User A → CKB Layer 1 → User B
```

a payment channel can operate as:

```text
Open/Fund Channel
       ↓
Off-chain payments
       ↓
Off-chain payments
       ↓
Off-chain payments
       ↓
On-chain settlement when required
```

This reduces the number of Layer 1 transactions required for repeated payments.

## 2.2 Key Concepts

### Payment Channel
A channel established between participants that allows them to exchange payments without recording every payment directly on Layer 1.

### Channel Capacity

The total amount of assets committed to a channel.

In the Fiber hands-on experiment, the channel was funded with:

**400 CKB**

### Off-chain Payment

A payment that updates the state/balance of the payment channel without immediately creating a new Layer 1 settlement transaction.

### Liquidity

The amount of funds currently available on a particular side/direction of a channel for making payments.

### Routing

When a direct payment channel does not exist between two participants, a payment can potentially be routed through intermediate nodes.

Therefore:

> **P2P connectivity alone does not guarantee payment readiness.**

A usable payment route also depends on channel state, liquidity, and the network graph.

---

# 3. Fiber Network

## 3.1 Introduction

Fiber Network is a CKB payment and swap network based on payment-channel concepts.

Its architecture can be viewed at a high level as:

```text
             Fiber Network
        ┌─────────────────────┐
        │                     │
   Node 1 ─── Payment ─── Node 2
        │                     │
        └─────────┬───────────┘
                  │
             CKB Layer 1
          Funding / Settlement
```

Fiber provides an off-chain layer for fast payments while CKB Layer 1 provides the underlying blockchain infrastructure.

---

# 4. Fiber Environment Setup

## 4.1 Installation Approach

The lab environment was based on **Windows x86_64**. Docker was unavailable, so the precompiled Fiber release was selected instead of Docker deployment or source compilation.

The selected version was:

```text
Fiber Node: fnn Fiber v0.9.0
Fiber CLI : fnn-cli 0.9.0
```

The binaries were kept inside the Week 3 workspace to avoid modifying previous environments.

Workspace:

```text
week-03/
├── config/
├── evidence/
├── node1/
├── node2/
├── perun-ckb-contract/
├── environment.md
├── setup.md
├── fnn.exe
├── fnn-cli.exe
└── fnn_v0.9.0-x86_64-windows.tar.gz
```

The Fiber binaries and configuration templates were verified after installation.

---

# 5. Fiber Hands-on Experiment

## 5.1 Two-Node Network

Two Fiber nodes were configured:

| | Node 1 | Node 2 |
|---|---|---|
| Fiber RPC | `8227` | `8226` |
| Fiber P2P | `8228` | `8229` |
| Role | Initiator | Acceptor |

Both nodes were connected to the CKB Testnet environment.

### Result

Both Fiber nodes successfully started and exposed their node information.

**Evidence #01 — Fiber Node Running**

`01-fiber-node-running.png`

---

## 5.2 Direct Peer Connection

Node 1 and Node 2 were connected directly through Fiber's P2P layer.

```text
Node 1
  │
  │ P2P connection
  ▼
Node 2
```

The peer information confirmed that the two Fiber nodes could discover and communicate with each other.

**Evidence #02 — Direct Peer Connection**

`02-direct-peer-connection.png`

---

# 6. Payment Channel Creation

After establishing P2P connectivity, a payment channel was opened between the two nodes.

The channel was funded with:

> **400 CKB**

The channel initially had the following balance distribution:

```text
Node 1: 400 CKB
Node 2:   0 CKB
```

This demonstrates an important distinction:

```text
P2P connection
      ≠
Payment channel
      ≠
Payment readiness
```

A peer connection is only the networking layer. A channel must subsequently be opened, funded, and reach a ready state before it can be used for payment.

**Evidence #03 — Payment Channel Opened**

`03-payment-channel-opened.png`

**Evidence #04 — Channel Created and Funding State**

`04-channel-created-and-funding-state.png`

---

# 7. Channel Ready State

After the funding process completed, the channel reached:

```text
ChannelReady
```

The initial channel state was:

```text
Node 1 local balance : 400 CKB
Node 2 local balance :   0 CKB
```

This confirmed that the channel was ready for off-chain payment operations.

**Evidence #05 — Channel Ready**

`05-channel-ready.png`

---

# 8. Fiber Payment Test

## 8.1 Invoice Creation

Node 2 generated an invoice for:

> **1 CKB**

The invoice used the Fiber Testnet currency:

```text
Fibt
```

This was an important implementation detail because Fiber uses different currency identifiers for different environments.

The generated invoice contained the payment hash and receiver information required by the sender.

**Evidence #06 — Invoice Created**

`06-invoice-created.png`

---

## 8.2 Payment Execution

Node 1 used the generated invoice to initiate the payment.

The payment initially entered the `Created` state and subsequently reached:

```text
Success
```

The payment completed with:

```text
Amount: 1 CKB
Fee:    0 CKB
Status: Success
```

**Evidence #07 — Payment Success**

`07-payment-success.png`

---

## 8.3 Payment Verification

On Node 2, the corresponding invoice was queried again.

The invoice status became:

```text
Paid
```

The payment hash matched the payment initiated by Node 1.

This provided receiver-side confirmation that the payment was successfully processed.

**Evidence #08 — Invoice Paid**

`08-invoice-paid.png`

---

# 9. Channel Balance After Payment

After the 1 CKB payment, the channel balance changed from:

```text
Before:

Node 1 = 400 CKB
Node 2 =   0 CKB
```

to:

```text
After:

Node 1 = 399 CKB
Node 2 =   1 CKB
```

This demonstrates the fundamental behavior of a payment channel: the participants' channel state is updated as payments occur without requiring every individual payment to be independently recorded on CKB Layer 1.

**Evidence #09 — Channel Balance After Payment**

`09-channel-balance-after-payment.png`

---

# 10. Fiber Payment Flow

The complete experiment can be summarized as:

```text
                 Fiber Network

Node 1                              Node 2
  │                                    │
  │─────── P2P connection ────────────►│
  │                                    │
  │──── Open payment channel ─────────►│
  │                                    │
  │────── Fund 400 CKB ───────────────►│
  │                                    │
  │◄──────── ChannelReady ────────────►│
  │                                    │
  │                         Create 1 CKB invoice
  │                                    │
  │◄──────────── Invoice ──────────────│
  │                                    │
  │────────── 1 CKB payment ──────────►│
  │                                    │
  │                         Invoice = Paid
  │                                    │
  │       Channel balance updated      │
  │                                    │
  │ 399 CKB                    1 CKB   │
```

This provided an end-to-end practical validation of the basic Fiber payment-channel workflow.

---

# 11. Fiber Network Concepts

## 11.1 Payment Readiness and Liquidity

A node being connected to the network does not necessarily mean that it can immediately send a payment.

Payment readiness depends on factors including:

- channel availability;
- channel state;
- available liquidity;
- network topology;
- available payment routes.

Therefore, the following distinction is important:

> **Connectivity enables communication; liquidity and routing enable payment.**

## 11.2 Routing

In a larger Fiber network, the sender and receiver may not have a direct channel.

A payment can potentially travel through intermediate nodes:

```text
Alice
  │
  ▼
Node A
  │
  ▼
Node B
  │
  ▼
Bob
```

This enables a payment-channel network to support payments between participants that do not maintain direct channels with each other.

## 11.3 Advanced Concepts

The following Fiber concepts were also reviewed at a conceptual level:

- HTLC/TLC
- Multi-Part Payment (MPP)
- Trampoline routing
- Watchtower
- Multi-asset / UDT support

These topics were studied as architectural concepts rather than implemented in the Week 3 hands-on experiment.

---

# 12. Perun Network

## 12.1 Introduction

Perun provides a payment-channel protocol approach where channel states and fund management can be enforced through blockchain smart contracts.

For CKB, the `perun-ckb-contract` project provides the on-chain contract implementation required to handle Perun channels.

At a high level:

```text
Perun Protocol
      │
      ▼
Perun CKB Contracts
      │
      ▼
CKB Layer 1
```

The main contract components include:

1. **Perun Channel Lock Script**
   - Controls access to the live channel cell.

2. **Perun Channel Type Script**
   - Validates channel state transitions and dispute-related operations.

3. **Perun Funds Lock Script**
   - Controls locked CKB/SUDT funds associated with the channel.

The CKB implementation follows the Perun protocol's state and verification model.

---

# 13. Perun Development Environment

The Perun CKB contract repository was built inside **WSL2 / Ubuntu 24.04**.

The environment required:

- Rust 1.85.0
- RISC-V target
- RISC-V GCC/binutils
- LLVM/Clang
- CKB cross-compilation libraries

The required RISC-V target was successfully prepared and the repository's `make prepare` step completed successfully.

**Evidence #10 — Perun Environment Ready**

`10-perun-environment-ready.png`

---

# 14. Perun Contract Build

The Perun contracts were successfully compiled using the repository's build process.

During the first build, the RISC-V environment reported:

```text
fatal error: 'gnu/stubs-lp64.h' file not found
```

The repository documentation provided a workaround for environments where this header was missing.

After applying the documented symlink workaround, the build was rerun successfully.

The final build completed with warnings only and produced the expected contract binaries.

**Evidence #11 — Perun Build Success**

`11-perun-build-success.png`

---

# 15. Perun Contract Tests

The Perun test suite was executed after the build.

Result:

```text
5 passed
0 failed
0 ignored
```

The successful tests included:

- channel test;
- channel VC test;
- cross-signature test;
- CKB key generation test;
- signature test.

This validated the local CKB contract build and test environment.

**Evidence #12 — Perun Tests Success**

`12-perun-tests-success.png`

> Note: The Week 3 Perun work validated the **CKB contract build/test environment**. It did not implement a complete end-to-end Perun payment between two live network nodes.

---

# 16. Fiber vs Perun

| Aspect | Fiber | Perun |
|---|---|---|
| Primary focus | Payment network | Payment-channel protocol/contracts |
| Main purpose | Fast off-chain payments | Secure channel/state enforcement |
| Network routing | Core concept | Not the primary focus |
| CKB integration | Funding and settlement | On-chain contract enforcement |
| Week 3 hands-on | End-to-end payment | Contract build and tests |
| Validation | 1 CKB payment succeeded | 5 tests passed |

The two approaches can therefore be viewed from different levels:

```text
                 Payment Channel Ecosystem

              ┌──────────────────────┐
              │      CKB Layer 1     │
              │ Security / Settlement│
              └──────────┬───────────┘
                         │
              ┌──────────┴───────────┐
              │                      │
        Fiber Network              Perun
      Payment Network        Channel Protocol /
       + Routing             CKB Contracts
```

---

# 17. CKB Perspective

The main architectural value of payment channels is the separation between:

### Off-chain execution

Optimized for:

- frequent payments;
- low latency;
- reduced transaction overhead;
- network-level scalability.

### On-chain settlement

CKB Layer 1 provides:

- asset ownership;
- channel funding;
- state verification;
- dispute/security mechanisms;
- final settlement.

Therefore, the overall model can be summarized as:

> **Use off-chain channels for efficiency and CKB Layer 1 for security and settlement.**

This architecture can reduce the amount of activity that needs to be directly processed by Layer 1 while retaining blockchain-based security.

---

# 18. Challenges and Lessons Learned

## 18.1 Fiber and Local OffCKB Devnet

The initial development environment used the local OffCKB devnet from previous weeks. However, the Fiber setup required the appropriate CKB Testnet scripts/state for its funding-channel mechanism.

Therefore, the Fiber experiment was moved to **CKB Testnet** instead of the local OffCKB devnet.

### Lesson

A payment-channel implementation may depend on specific on-chain scripts and network state. A generic local CKB devnet is not necessarily interchangeable with the target CKB network.

---

## 18.2 Fiber Currency Configuration

The initial attempt used:

```text
CKB
```

as the Fiber invoice currency and failed because Fiber expects network-specific currency identifiers.

For Testnet, the correct value was:

```text
Fibt
```

### Lesson

Fiber configuration is network-specific and requires correct environment identifiers.

---

## 18.3 Connectivity vs Payment Readiness

Successfully connecting two Fiber nodes was not sufficient to perform a payment.

The channel also needed to be:

```text
Opened
   ↓
Funded
   ↓
ChannelReady
   ↓
Sufficient liquidity
   ↓
Payment
```

### Lesson

A functional payment-channel network consists of more than P2P connectivity.

---

## 18.4 Perun Cross-Compilation

The Perun CKB contracts target RISC-V rather than the host x86_64 architecture.

The build initially failed because:

```text
gnu/stubs-lp64.h
```

was missing.

After applying the documented workaround, compilation completed successfully.

### Lesson

CKB smart-contract development requires understanding both the Rust environment and the target architecture/toolchain.

---

# 19. Results Summary

The Week 3 practical work successfully achieved the following:

### Fiber

- Fiber v0.9.0 installed.
- Two Fiber nodes initialized.
- Node-to-node P2P connection established.
- 400 CKB payment channel created and funded.
- Channel reached `ChannelReady`.
- 1 CKB Testnet invoice created.
- 1 CKB payment successfully completed.
- Receiver verified the invoice as `Paid`.
- Channel balance updated from **400/0 CKB → 399/1 CKB**.

### Perun

- WSL2/Ubuntu development environment prepared.
- Required RISC-V build environment configured.
- Perun CKB contracts built successfully.
- Perun test suite completed successfully.
- **5 tests passed, 0 failed.**

---

# 20. Conclusion

Week 3 provided both **theoretical understanding and practical validation** of payment channels on CKB.

The Fiber experiment demonstrated the complete basic lifecycle:

```text
P2P Connection
      ↓
Channel Creation
      ↓
Channel Funding
      ↓
ChannelReady
      ↓
Invoice
      ↓
Off-chain Payment
      ↓
Payment Verification
      ↓
Updated Channel Balance
```

The Perun work provided a complementary view by examining how payment-channel state and funds can be enforced through **CKB smart contracts**.

The main takeaway is that payment channels extend CKB's capabilities by moving frequent payment activity off-chain while retaining CKB Layer 1 as the underlying security and settlement layer.

---

# Evidence Index

| Evidence | File |
|---|---|
| #01 | `01-fiber-node-running.png` |
| #02 | `02-direct-peer-connection.png` |
| #03 | `03-payment-channel-opened.png` |
| #04 | `04-channel-created-and-funding-state.png` |
| #05 | `05-channel-ready.png` |
| #06 | `06-invoice-created.png` |
| #07 | `07-payment-success.png` |
| #08 | `08-invoice-paid.png` |
| #09 | `09-channel-balance-after-payment.png` |
| #10 | `10-perun-environment-ready.png` |
| #11 | `11-perun-build-success.png` |
| #12 | `12-perun-tests-success.png` |
