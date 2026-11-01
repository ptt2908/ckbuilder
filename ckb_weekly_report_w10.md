# Week 10 Report - ReuseLoop Smart Contract Architecture and Implementation
**Reporting period:** 26 Oct - 1 Nov 2026   
**Participant:** Pham Tan Thinh  
**Program:** CKB Builder Track
## 1. Courses and Topics Completed

During Week 10, I focused on designing, implementing, and validating the
core CKB smart contracts for the ReuseLoop project.

The main topics covered were:

-   **CKB Script Architecture**
    -   Type Scripts and Lock Scripts responsibilities.
    -   Cell lifecycle and transaction validation.
    -   Script arguments and on-chain data structures.
    -   Cell dependencies and trusted contract references.
-   **Registry and State Management**
    -   Registry Cell design for tracking registered item IDs.
    -   State Cell design for representing item lifecycle status.
    -   Registry identity and Type ID derivation.
    -   Atomic updates across multiple Script groups.
-   **CKB Transaction and Capacity Rules**
    -   Input/Output cardinality validation.
    -   Cell occupied capacity and capacity preservation.
    -   Append-only data structures.
    -   Error handling and transaction invariant enforcement.
-   **Rust Smart Contract Development**
    -   Implementing CKB Scripts using `ckb-std`.
    -   Testing contracts with `ckb-testtool`.
    -   Building Rust contracts for the CKB RISC-V target.
    -   Validating contract behavior through positive and negative test
        cases.

## 2. Exercises and Practical Work

### 2.1. Contract Architecture and Specification

Completed the core architecture and specification for the ReuseLoop
on-chain data model.

Two types of Cells were defined:

**Registry Cell** - Maintains the list of registered item IDs. - Uses a
fixed-size Registry Type Script argument structure of 98 bytes. - Stores
item IDs using an append-only data structure. - Supports up to 100
registered items in the current MVP.

**State Cell** - Represents the lifecycle status of an individual
reusable item. - Uses a 97-byte State Type Script argument structure. -
Stores a 34-byte data structure containing the schema version, item ID,
and current status. - Supports three on-chain statuses: -
`AVAILABLE (0x00)` - `BORROWED (0x01)` - `RETURNED (0x02)`

The architecture also establishes the relationship between Registry and
State Cells through cryptographic Script identity and trusted Registry
references.

### 2.2. Registry Type Script Implementation

Implemented the Registry Type Script to enforce Registry identity,
registration, and data integrity.

Main functionalities:

-   Validate Registry Script arguments and data format.
-   Derive and verify the Registry ID using the CKB Type ID formula.
-   Validate Registry Genesis transactions (`0 -> 1`).
-   Enforce Registry updates (`1 -> 1`).
-   Maintain append-only item registration.
-   Reject duplicate item IDs.
-   Enforce the maximum capacity of 100 registered items.
-   Validate the canonical State Cell output during registration.
-   Preserve Registry capacity during updates.

The Registry Script ensures that registered item IDs cannot be
arbitrarily modified or removed through an invalid transaction.

### 2.3. State Type Script Hardening

Extended the State Type Script to enforce item lifecycle invariants and
establish a trusted relationship with the Registry.

Main functionalities:

-   Validate State Script arguments and Cell data.
-   Enforce State Cell input/output cardinality.
-   Reject State Cell burning.
-   Validate permitted lifecycle transitions.
-   Verify administrator Lock Script hashes.
-   Validate State Cell capacity.
-   Require a trusted Registry CellDep during lifecycle transitions.
-   Verify that the target item ID exists in the trusted Registry.
-   Reject transactions that attempt to modify Registry Cells during
    ordinary State lifecycle operations.

The permitted lifecycle is:

`AVAILABLE -> BORROWED -> RETURNED -> AVAILABLE`

The contract prevents unsupported transitions and ensures that the State
Cell maintains its item identity throughout its lifecycle.

### 2.4. Atomic Registry and State Registration

Implemented atomic registration to ensure that a new item is registered
consistently in both the Registry and State layers.

The registration transaction must contain:

-   One Registry input and one Registry output.
-   No State input and exactly one State output.
-   An append-only Registry update.
-   A newly created State Cell with the matching item ID.
-   An initial State status of `AVAILABLE`.
-   Administrator-controlled Lock Script authorization.

Both Registry and State Type Scripts independently validate the
registration invariants.

This ensures that a new item cannot be registered in only one layer
while leaving the other layer inconsistent.

### 2.5. Integration and Negative Testing

Expanded the Rust test suite to cover contract behavior and
transaction-level interactions.

The test implementation includes:

-   Registry Genesis validation.
-   First and subsequent item registration.
-   Duplicate registration rejection.
-   Invalid Registry updates.
-   State lifecycle transitions.
-   State Cell burning rejection.
-   Missing or untrusted Registry references.
-   Invalid arguments and Cell data.
-   Capacity violations.
-   Administrator signature validation.
-   Atomic registration with real Registry and State Script binaries.

An end-to-end test was also implemented to exercise the Registry
Genesis, atomic registration, and State lifecycle flow using the actual
contract binaries.

## 3. Verification Results

The following verification activities were completed:

  Verification                   Result
  ------------------------------ ---------------------
  Rust automated test suite      77 passed, 0 failed
  CKB RISC-V release build       Passed
  Registry contract build        Passed
  State contract build           Passed
  Clippy with `-D warnings`      Passed, 0 warnings
  Scoped Rust formatting check   Passed
  `git diff --check`             Passed

The contracts were successfully compiled for the CKB RISC-V target.

The generated release artifacts included:

-   `registry`: approximately 55 KB
-   `state`: approximately 37 KB

The integration tests also verified administrator authorization using
the bundled CKB `secp256k1_blake160_sighash_all` Lock Script, including
valid, incorrect, corrupted, and missing signature cases.

## 4. Key Learnings

### 4.1. Separation of Responsibilities Between Type Scripts and Lock Scripts

A key architectural lesson was understanding the distinction between
transaction invariants and cryptographic authorization.

-   Type Scripts validate Cell structure, state transitions, Registry
    linkage, and configured Lock Script hashes.
-   Lock Scripts perform the actual cryptographic signature
    verification.

This separation allows the contracts to enforce business-related
on-chain invariants without incorrectly duplicating Lock Script
responsibilities.

### 4.2. Atomic Registration Across Multiple Script Groups

When a transaction updates multiple Script groups, each Type Script
validates its own group and related transaction data.

Therefore, atomic registration requires both Registry and State Scripts
to validate compatible conditions. A successful transaction must satisfy
both sets of invariants.

### 4.3. Registry Identity and Trust Relationships

A Registry ID and a Registry Type Script hash serve different purposes.

-   The Registry ID is derived from the Type ID mechanism.
-   The Registry Type Script hash identifies the complete Registry
    Script, including its arguments.
-   The State Script stores the trusted Registry Type Script hash to
    prevent an unrelated Registry instance from being used as its
    reference.

This provides a cryptographic linkage between the Registry and
individual State Cells.

### 4.4. Capacity Is Part of Contract Correctness

Cell capacity is not simply a transaction construction concern. It is
also an invariant that must be enforced by the contracts.

The implementation distinguishes occupied capacity from capacity
preservation and applies the appropriate checks to Genesis,
Registration, and Lifecycle transactions.

### 4.5. On-chain State and Off-chain Business Workflow

The blockchain records the verified on-chain lifecycle transitions, but
it cannot independently prove physical events such as item handover,
return, cleaning, or inspection.

Consequently, ReuseLoop separates:

-   On-chain item status.
-   Off-chain business workflow status and Store/Customer confirmations.

This distinction is important for building a practical multi-party reuse
application.

## 5. Challenges and Open Questions

### 5.1. Cross-Script Validation

Atomic registration required careful coordination between Registry and
State Type Scripts.

Each Script must independently validate relevant transaction properties
while preserving consistent error handling and avoiding assumptions
about Script execution order.

### 5.2. CKB Cell Capacity and Serialization

Capacity validation required distinguishing Cell Data length, occupied
capacity, and Molecule serialization size.

Using the CKB occupied-capacity syscall instead of manually estimating
capacity helps avoid incorrect assumptions about Cell storage
requirements.

### 5.3. Test Coverage Boundaries

Although the test suite reached 77 passing tests, several defensive
checks still lack dedicated negative tests at the individual Script
level.

These limitations were identified and documented during the final
documentation audit. They do not indicate known implementation failures,
but they remain potential areas for future test expansion.

### 5.4. Administrator Authorization Model

The current MVP uses an administrator-controlled on-chain authorization
model.

Store and Customer confirmations remain off-chain, while the
administrator signs and submits the corresponding CKB transactions.

This is an intentional MVP design decision. More decentralized
authorization mechanisms are outside the scope of the current
implementation.

## 6. Plan for Next Week

Week 11 will focus on preparing the smart contracts for integration with
the ReuseLoop application.

Planned activities:

1.  **Contract Deployment Preparation**
    -   Finalize contract binaries and deployment configuration.
    -   Prepare Registry and State Script deployment information.
    -   Configure the required Script hashes and arguments.
2.  **CKB Testnet Integration**
    -   Deploy and initialize the Registry.
    -   Prepare State Cell registration transactions.
    -   Verify contract behavior on CKB Testnet.
3.  **Application and Transaction Integration**
    -   Implement or refine transaction construction.
    -   Connect backend workflows with the Registry and State contracts.
    -   Handle transaction submission and confirmation.
    -   Reflect confirmed on-chain states in the application.
4.  **End-to-End Validation**
    -   Test item registration.
    -   Test borrow and return workflows.
    -   Validate transaction results and error handling.
    -   Verify consistency between application state and on-chain state.

------------------------------------------------------------------------

## Week 10 Final Result

Week 10 completed the core smart contract architecture and
implementation for ReuseLoop.

The Registry and State Type Scripts now enforce item registration,
Registry-State linkage, atomic registration, and the permitted item
lifecycle. The implementation was validated with 77 passing automated
tests, successful CKB RISC-V builds, and static analysis checks.

The five core design documents were also aligned with the implementation
and passed the final cross-document consistency audit.

This establishes the on-chain foundation required for the next phase:
integrating ReuseLoop with CKB Testnet and the application backend.
