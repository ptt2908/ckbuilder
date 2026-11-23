# CKBuilders -- Week 05 Report

## CKB dApp: Spore Lifecycle, Transaction Tracking, and Reliability

**Program:** CKBuilders\
**Week:** 05\
**Reporting Period:** 21 September - 27 September 2026\
**Participant:** Pham Tan Thinh\
**Project:** CKB dApp using React, TypeScript, and `@ckb-ccc`\
**Network:** CKB Testnet\
**Frontend:** React + TypeScript + Vite

------------------------------------------------------------------------

## 1. Overview

During Week 05, I continued developing a decentralized application
(dApp) on Nervos CKB, focusing on the Spore Protocol and the reliability
of transaction-related features.

The work covered the Spore lifecycle (creation, transfer, and melt),
wallet connectivity, transaction tracking, persistent transaction
history, error handling, and on-chain verification through CKB Testnet
Explorer. The application was also reviewed and built successfully after
the latest code updates.

This report summarizes both the implementation completed during the week
and the key technical concepts learned while working on it.

## 2. Objectives

-   Understand how Spore assets are represented and managed on CKB.
-   Implement the main Spore lifecycle operations in a frontend dApp.
-   Connect a wallet and interact with CKB Testnet.
-   Track transaction status and retain a local transaction history.
-   Improve user feedback and reliability when operations fail or inputs
    are invalid.
-   Verify transaction effects using on-chain data rather than relying
    only on the frontend UI.

## 3. Development Environment and Technology

  Component                           Technology / Tool
  ----------------------------------- -----------------------------------------
  Frontend framework                  React
  Programming language                TypeScript
  Development server and build tool   Vite
  CKB interaction                     `@ckb-ccc/ccc` and related CCC packages
  Wallet connection                   JoyID
  Blockchain network                  CKB Testnet
  Asset model                         Spore Protocol
  Transaction verification            CKB Testnet Explorer
  Local transaction persistence       Browser `localStorage`
  Development environment             Windows, PowerShell, Node.js / npm

The application is implemented as a frontend dApp. Wallet signing and
transaction submission are performed through the connected wallet and
CKB tooling; the frontend presents operation results and transaction
information to the user.

## 4. Work Completed

### 4.1 Spore lifecycle

The application supports the core Spore lifecycle operations:

-   **Create Spore:** Create a Spore asset and submit the corresponding
    transaction to CKB.
-   **Transfer Spore:** Transfer an existing Spore to a recipient
    address.
-   **Melt Spore:** Melt a Spore through the application and verify the
    resulting transaction on-chain.

These operations provide practical experience with creating and managing
CKB assets through transactions, including selecting an asset, supplying
operation parameters, submitting a transaction, and checking its result.

### 4.2 Wallet connection and asset information

JoyID wallet connectivity was used to authorize user actions. The
application also includes wallet-related information and interaction
features, including CKB balance display, xUDT-related functionality, and
message signing.

The wallet acts as the user's authorization interface: the application
can prepare an operation, but signing requires the connected wallet's
approval.

### 4.3 Transaction history and persistence

A transaction history feature was implemented to retain transaction
records in browser `localStorage`.

The work included:

-   Recording transaction information for later review.
-   Loading saved records when the application is reopened or refreshed.
-   Avoiding duplicate history entries by using the transaction hash
    (`txHash`) as a deduplication key.
-   Displaying transaction information in the frontend.

This persistence is browser-local. It helps retain the user's interface
history on the same browser profile, but it is not a replacement for the
canonical transaction data stored on CKB.

### 4.4 Transaction query and status reliability

Transaction lookup and status handling were exercised with multiple
cases. The work focused on making transaction-related behavior easier to
inspect and on providing meaningful feedback when a query or operation
cannot be completed.

The application uses the CKB tooling's transaction-waiting functionality
(`waitTransaction`) for transaction confirmation checks. It does not
implement a separate custom polling engine.

Reliability testing included successful and unsuccessful query
scenarios, and the resulting behavior was documented as evidence.

### 4.5 Spore loading reliability

Spore loading behavior was tested to check how the application behaves
when retrieving the user's Spore assets. This work helped identify the
importance of handling data retrieval as a potentially fallible
operation rather than assuming that every request will return valid data
immediately.

### 4.6 Error handling and input validation

The UI was checked and improved for several invalid or incomplete
user-input cases:

-   An invalid recipient address was submitted for a transfer. The
    application displayed a transfer failure and surfaced the
    address-format error.
-   When the recipient field was empty, the Transfer button was
    disabled.
-   When no Spore was selected, the Transfer button was disabled.

These checks help prevent avoidable invalid actions and give the user
clearer feedback. The application build was also run successfully after
the latest code changes.

### 4.7 On-chain verification

Transactions were inspected using CKB Testnet Explorer. This was used to
compare what the frontend reported with the transaction data recorded
on-chain.

The verification work included:

-   Looking up transactions by transaction hash.
-   Inspecting input and output cells.
-   Comparing Lock Script information before and after a Spore transfer.
-   Checking that the transferred Spore appeared under the recipient
    wallet's owned assets.
-   Verifying the transaction associated with a Spore melt.

The transfer comparison showed that the Lock Script arguments changed
between the relevant input and output ownership states, while the Lock
Script `code_hash` and `hash_type` remained the same. The Spore's Type
Script information was preserved in the comparison, including its
`code_hash`, `hash_type`, and `args`.

This inspection provided practical experience in reading transaction
structure and relating cell scripts to asset ownership and identity.

### 4.8 Code review and build validation

The frontend source was reviewed and updated to improve operation
feedback in relevant flows. The latest version was then checked with the
Vite production build command:

``` powershell
npm.cmd run build
```

The build completed successfully, confirming that the current frontend
source passed the project's build-time checks. This does not, by itself,
replace runtime testing or on-chain verification.

## 5. Key Concepts Learned

### 5.1 Cells and UTXO-style state on CKB

Nervos CKB represents on-chain state using **Cells**. A cell contains
capacity, a lock script, and optionally a type script and data.
Transactions consume existing cells as inputs and create new cells as
outputs.

This means a state change is generally represented by creating a new
transaction that consumes prior state and produces updated output cells,
rather than modifying an existing cell in place.

### 5.2 Lock Script

A **Lock Script** defines the conditions required to unlock a cell and
use it as a transaction input. In a wallet-controlled cell, the lock
script is associated with the authorization mechanism for spending that
cell.

During the Spore transfer inspection, the Lock Script's `code_hash` and
`hash_type` stayed consistent while the `args` differed between
ownership states. This illustrates that script arguments can carry
instance-specific information used by a script, while the code hash and
hash type identify how the script code is referenced.

The exact meaning of script arguments depends on the particular script
implementation; it should be interpreted from the relevant protocol or
script definition rather than assumed from the field name alone.

### 5.3 Type Script

A **Type Script** can enforce rules about a cell's type or the validity
of operations involving that cell. In the Spore context, the Type Script
is part of how Spore assets are identified and validated.

The Explorer comparison showed the Spore Type Script fields being
preserved across the observed transfer. This helped distinguish the
asset's protocol/type information from the Lock Script information used
for spending authorization.

### 5.4 Spore assets and lifecycle

Spore is an asset protocol on CKB. A Spore is represented on-chain
through cells and scripts, and its lifecycle is expressed through
transactions.

The main operations explored in this work were:

-   **Creation:** producing a new Spore representation on-chain.
-   **Transfer:** consuming the current cell and creating an output that
    reflects the new ownership state.
-   **Melt:** executing the protocol's melt operation, with the result
    represented by a transaction.

The key learning is that these are not merely frontend state changes.
They are blockchain transactions whose effects can be checked
independently through on-chain data.

### 5.5 Transactions, transaction hashes, and confirmation

A CKB transaction describes the inputs it consumes and the outputs it
creates, along with the scripts and witnesses required for validation.

The transaction hash (`txHash`) serves as a stable identifier for
looking up a submitted transaction. A frontend can use it to display
transaction details, query its status, and link the user to an Explorer.

Transaction submission and transaction confirmation are distinct stages.
A submitted transaction may not yet be confirmed in a block. Therefore,
the UI should communicate status carefully and avoid treating submission
alone as proof that the operation is finalized on-chain.

### 5.6 Wallet signing and dApp authorization

A dApp can prepare transaction data, but a wallet such as JoyID is
responsible for the user's signing authorization. This separation is
important because the application should not silently perform a spend on
the user's behalf.

The wallet connection therefore provides both an account context for the
frontend and a user-controlled signing step for blockchain operations.

### 5.7 Local persistence versus blockchain state

The transaction history uses browser `localStorage`, which persists data
within the browser profile. This improves usability across page reloads,
but it is not itself blockchain storage.

The blockchain remains the authoritative source for transaction and cell
state. Local history is a convenience layer and can be cleared,
unavailable in another browser, or become stale. For that reason,
transaction records should be cross-checked against the transaction hash
and on-chain data when correctness matters.

### 5.8 Reliability and defensive UI behavior

Blockchain applications depend on external components such as wallet
providers, RPC endpoints, transaction indexers, and network
confirmation. Requests can fail, take time, or return incomplete
information.

The week's testing reinforced several practical reliability principles:

-   Validate required inputs before enabling an operation.
-   Handle rejected or malformed input with understandable feedback.
-   Distinguish a failed request from a transaction that is still
    pending.
-   Avoid duplicate history entries.
-   Allow users to verify important outcomes independently on-chain.
-   Do not treat a successful frontend build as proof that every runtime
    path works.

## 6. Testing and Evidence

The following checks were completed and captured as Week 05 evidence:

  Evidence   Description
  ---------- --------------------------------------------------------------
  01--03     Spore transfer, melt, and automatic tracking checkpoints
  04         Transaction history persistence
  05         Spore loading reliability
  06         Transaction query reliability, including multiple test cases
  07         Script inspection
  08         CKB Testnet Explorer transaction lookup
  09         Lock Script comparison between input and output
  10         Recipient wallet ownership verification
  11         Spore melt operation
  12         On-chain verification of the melt transaction

Additional input-validation checks were performed for an invalid
recipient address, an empty recipient field, and the absence of a
selected Spore. The empty-recipient and no-selection cases were checked
through the disabled Transfer button behavior.

**Note:** The optional final transaction-history persistence checkpoint
was intentionally skipped. The report therefore does not claim that this
additional checkpoint was completed.

## 7. Results

By the end of Week 05:

-   The frontend supported the main Spore operations: create, transfer,
    and melt.
-   JoyID was used as the wallet connection and signing interface.
-   Transaction records could be retained locally and deduplicated by
    transaction hash.
-   Transaction lookup, Spore loading, and invalid-input behavior were
    exercised.
-   Explorer inspection was used to verify transaction details, script
    fields, recipient ownership, and melt results.
-   The latest frontend source completed a successful Vite production
    build.

Together, these tasks connected frontend dApp development with CKB's
cell-based transaction model and provided hands-on practice in checking
application behavior against on-chain state.

## 8. Limitations and Notes

-   Transaction history is stored in browser `localStorage`; it is not a
    synchronized, account-independent history service.
-   Transaction confirmation handling uses the available CCC
    `waitTransaction` function. A custom polling/retry framework was not
    implemented as part of the described work.
-   Evidence and tests cover the cases listed in this report; they
    should not be interpreted as exhaustive security, load, or
    protocol-conformance testing.
-   A successful production build confirms build-time validity, but
    runtime behavior still depends on wallet availability, RPC
    connectivity, network conditions, and user input.

## 9. Next Steps

Potential follow-up work, subject to the next project roadmap, includes:

-   Review and document the frontend architecture and transaction flow.
-   Improve transaction status presentation for pending, confirmed, and
    failed states.
-   Expand automated tests for validation and failure scenarios.
-   Review RPC and wallet error handling across all transaction-related
    features.
-   Explore custom Lock Script development as a separate extension if it
    is included in a future learning objective.

## 10. Conclusion

Week 05 focused on building and validating a CKB dApp around the Spore
asset lifecycle. Beyond implementing frontend operations, the work
emphasized transaction persistence, input validation, reliability
checks, and independent verification through CKB Testnet Explorer.

The main outcome was a more complete understanding of how a dApp
interacts with CKB: the frontend prepares and presents operations, the
wallet authorizes signing, transactions consume and create cells,
scripts enforce spending and type rules, and on-chain data provides the
basis for verifying the final result.
