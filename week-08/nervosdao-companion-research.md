# Week 8 Research — NervosDAO Companion

**Status:** Protocol research completed; read-only Testnet header/calculation demo ran successfully
**Scope:** Understand NervosDAO deposit, compensation, maturity, and withdrawal; test whether a companion can make these states easier to inspect
**Decision status:** Research candidate only; no capstone selected
**Research date:** 2026-10-19

## 1. Research question

Could a NervosDAO Companion help a CKB holder understand each DAO position, estimate its compensation, and see when the two-step withdrawal can proceed—without hiding the underlying CKB rules or presenting the estimate as guaranteed yield?

This report separates protocol facts from the prototype. The demo reads public Testnet block headers and calculates a hypothetical position. It does not read a wallet, build a transaction, or deposit/withdraw CKB.

## 2. Executive summary

NervosDAO is a native CKB script for depositing CKB and receiving a proportional share of secondary issuance, which counteracts dilution from that issuance. It is not a fixed-rate savings account: the compensation for a particular deposit depends on the DAO accumulated rate at the deposit and withdrawal reference blocks, and excludes the capacity occupied by the cell's storage.

Withdrawal takes two transactions:

1. **Prepare:** consume the deposit cell and create a withdrawing cell. This can be initiated before the end of the deposit period.
2. **Withdraw:** consume the withdrawing cell and transfer principal plus compensation. The input must satisfy the DAO script's absolute epoch `since` requirement, with a minimum period of 180 epochs.

A useful companion could show a wallet's DAO deposit/withdrawing cells, their source block and current maturity, and an estimate of the maximum withdrawable capacity. The official `ckb-cli` already supports DAO deposit, prepare, withdraw, and balance queries using a local index, so a capstone should add a clearer status/decision layer instead of rebuilding a generic DAO transaction CLI. [CKB CLI](https://github.com/nervosnetwork/ckb-cli)

## 3. Protocol model

### 3.1 Deposit cell

A DAO deposit is a CKB cell with the NervosDAO type script and eight bytes of zero data; the transaction references the DAO script through a cell dependency. The deposit cell remains locked under its lock script and is interpreted by the NervosDAO type script. [RFC #0023: deposit requirements](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md)

### 3.2 Two-phase withdrawal

The first transaction converts a deposit cell into a withdrawing cell. The withdrawing cell keeps the same capacity and DAO type script; its eight-byte data stores the original deposit block number as a 64-bit little-endian integer. The second transaction references both relevant headers and uses an absolute epoch `since` that meets the lock requirement. The minimum is 180 epochs; if the user misses an eligible period, another period begins automatically. [RFC #0023: withdrawal phases and lock period](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md)

The compensation period and the withdrawal lock are not the same event. Phase 1 may happen before the 180-epoch point, but phase 2 cannot be included until its `since` condition is satisfied. A UI should label “ready to prepare” and “ready to withdraw” separately.

### 3.3 Header data and calculation

Each CKB block header has a 32-byte `dao` field containing four unsigned 64-bit little-endian values in order: total issuance `C`, accumulated rate `AR`, unissued secondary issuance `S`, and occupied capacity `U`. `AR` is scaled by `10^16`. The compensation for a deposit cell is calculated only on capacity left after its occupied storage:

~~~text
compensation = (cell_capacity - occupied_capacity) × AR_withdraw / AR_deposit
                - (cell_capacity - occupied_capacity)
maximum withdrawal = compensation + cell_capacity
~~~

Integer arithmetic and flooring apply in the on-chain script. The script also derives occupied capacity from the cell itself. [RFC #0023: DAO field and formula](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md) [CKB system DAO script](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/dao.c)

This is compensation for a share of secondary issuance, not a fixed APY. A calculator that shows a projected annual percentage without explaining the observed header interval, occupied capacity, and assumptions could mislead users.

## 4. Companion concept

### Proposed user flow

1. Connect a wallet or enter a public address; show DAO cells grouped as **Deposited**, **Preparing**, **Ready to withdraw**, or **Waiting for next period**.
2. For each cell, show capacity, occupied capacity, deposit block/epoch, current epoch, and the next eligible epoch.
3. Calculate an estimated maximum withdrawal using the relevant DAO header rates; show assumptions and the block headers used.
4. Explain the next action and its consequence. Keep prepare and withdraw as explicit, separately reviewed wallet actions.
5. Link each displayed status and estimate to its source cell/header so the user can audit it.

### Possible capstone boundary

A first version can be a read-only portfolio and maturity dashboard with an auditable calculator. Transaction creation/signing could be a later, separately scoped feature using a wallet connector and established CKB SDK/CLI behavior. The prototype in this report is smaller: it validates header retrieval, DAO field decoding, epoch comparison, and the formula only.

## 5. Demo and observed result

### What the demo does

[`nervosdao-companion-demo/dao-companion-demo.ps1`](nervosdao-companion-demo/dao-companion-demo.ps1) uses the public CKB Testnet JSON-RPC endpoint to:

- Read the current tip header and a historical header at a chosen block number.
- Decode each DAO field into its four 64-bit little-endian values.
- Compare the deposit epoch with the 180-epoch eligible point.
- Treat the current tip as the hypothetical phase-1/prepare inclusion header, then apply the RFC formula to the supplied capacity and occupied capacity. For a real withdrawing cell, the estimate must use that cell's actual prepare inclusion header.

It does not request an address or key, query a wallet's cells, construct a transaction, or call a state-changing RPC. Public endpoints are for development/testing and may be unavailable or rate limited. [CKB SDK Testnet endpoint example](https://docs.nervos.org/docs/sdk-and-devtool/go)

### Run

From PowerShell in the demo folder:

~~~powershell
.\dao-companion-demo.ps1
~~~

Choose a deposit reference and hypothetical cell size:

~~~powershell
.\dao-companion-demo.ps1 -DepositBlockNumber 22284559 -DepositCapacityCkb 10000 -OccupiedCapacityCkb 100
~~~

See [`nervosdao-companion-demo/README.md`](nervosdao-companion-demo/README.md) for parameters and limitations.

### Observed run

The script ran successfully on 2026-10-19 against `https://testnet.ckb.dev`. At the time of the run, it reported a Testnet tip near block 22,784,569 and used block 22,284,569 as the default deposit reference. The epochs were approximately 14,029 and 13,751, so the 180-epoch point had passed. For the **assumed** 10,000 CKB cell with 100 CKB occupied capacity, the illustrative compensation was about **26.46964824 CKB**.

These numbers are a record of one live Testnet observation, not a forecast, wallet balance, or promise of future compensation. A later run will use a newer tip. The current tip is assumed to be the phase-1/prepare reference for this hypothetical calculation. The capacity and occupied capacity are arbitrary demo inputs; a real withdrawing cell must use its actual prepare header and actual occupied capacity.

## 6. What is verified and what remains open

**Verified in this spike**

- Testnet RPC returned tip and historical headers.
- The header `dao` field parsed into plausible monotonically increasing accumulated rates after correcting the byte-order handling.
- The demo computed a mature epoch comparison and a non-negative hypothetical compensation using integer shannon units.
- No wallet data or transaction was involved.

**Not verified**

- Discovery of real user-owned DAO cells and their original inclusion headers.
- Full maturity handling across all epoch-boundary cases against a DAO transaction/script test vector.
- Whether a reliable public indexer will be available for a production companion; a deployed app may need its own CKB Indexer or a user-configured RPC.
- Wallet connection, transaction generation, signing, fee handling, and broadcast.
- Security, privacy, and UX for exposing a wallet's position data.

## 7. Risks and design notes

- **Estimate vs. final amount:** the actual cell's occupied capacity and the exact protocol headers must be used. Never treat user-entered demo inputs as the user's actual deposit.
- **Maturity language:** deposit period, prepare status, and phase-2 eligibility are distinct. Use the exact epoch fraction and absolute `since` semantics rather than approximate calendar dates.
- **Indexing dependency:** a wallet portfolio requires finding live cells by lock script and tracing their creation block. That requires an indexer or another reliable cell-query service; plain tip/header RPC alone is not enough.
- **Action safety:** prepare consumes the deposit cell, and withdraw consumes the withdrawing cell. The app must show which cell and transaction phase it is asking the wallet to authorize.
- **Existing tooling:** CKB CLI can already perform the core DAO actions. Differentiation should come from understandable position tracking, maturity explanation, and auditable estimates.
- **Terminology:** describe DAO compensation and secondary issuance, not a guaranteed interest rate or fixed APY.

## 8. Fit with the Week 8 shortlist and Handbook

NervosDAO Companion is a focused CKB-native utility: the central data and rules are CKB cells, CKB headers, the DAO system script, and epoch `since` validation. It could demonstrate useful wallet UX and CKB economic mechanics, but the amount of product value depends on whether the capstone includes real cell discovery and trustworthy maturity tracking, not just a calculator.

For Week 8, it remains one research candidate alongside DOB Studio and Fiber Payment Ops. No capstone is selected here. The next discussion should compare the DAO companion's data/indexing scope and user value with Fiber's payment workflow, then ask Neon which scope best matches the program's expected capstone depth.

## 9. Sources

- [Nervos RFC #0023 — Deposit and Withdraw in Nervos DAO](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md)
- [CKB system DAO script (`dao.c`)](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/dao.c)
- [Official CKB CLI](https://github.com/nervosnetwork/ckb-cli)
- [CCC DAO example: calculation and claim epoch](https://docs.nervos.org/docs/sdk-and-devtool/ccc)
- [CKB Go SDK: Testnet endpoint example](https://docs.nervos.org/docs/sdk-and-devtool/go)


