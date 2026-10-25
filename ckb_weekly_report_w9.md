# CKBuilders Week 9 Report - ReuseLoop

**Project:** ReuseLoop - Reusable Packaging Return System\
**Reporting period:** Week 9\
**Status:** Scope and design established; initial State Script technical
spike verified

## 1. Overview

During Week 9, the project focused on defining the ReuseLoop MVP,
documenting the proposed CKB architecture, setting up the Rust
smart-contract workspace, and validating an initial State Script
prototype.

The goal of this stage was to establish a practical technical foundation
for the core item lifecycle. The work completed so far is an initial
prototype, not a complete or production-ready implementation of the
ReuseLoop MVP.

## 2. Scope and Architecture

The MVP models each reusable item with three lifecycle states:

-   `AVAILABLE`
-   `BORROWED`
-   `RETURNED`

The permitted transitions are:

1.  `AVAILABLE -> BORROWED`
2.  `BORROWED -> RETURNED`
3.  `RETURNED -> AVAILABLE`

The return process is intentionally represented as two transitions: the
receiving point confirms the return, and the item is subsequently made
available again.

The proposed on-chain design uses a Registry Cell to record registered
item IDs and a State Cell for each item's current lifecycle state. The
Registry and State linkage, as well as the full authorization rules,
remain planned implementation work.

## 3. Design and Documentation

The project has design documents covering the proposed architecture,
requirements, state machine, transaction design, Registry design, Cell
linkage, and implementation plan.

The State Cell data format used by the initial prototype is 34 bytes:

  ------------------------------------------------------------------------
  Field                                         Size Description
  --------------------- ---------------------------- ---------------------
  Schema version                              1 byte Currently `0x01`

  Item ID                                   32 bytes Item identifier

  Status                                      1 byte `0` = `AVAILABLE`,
                                                     `1` = `BORROWED`, `2`
                                                     = `RETURNED`
  ------------------------------------------------------------------------

The State Type Script uses its 32-byte script arguments as the expected
item ID and checks that the input and output data follow the expected
format.

## 4. Development Environment and Technical Spike

A Rust workspace was created for CKB scripts and integration tests. The
State contract was successfully built for the
`riscv64imac-unknown-none-elf` target using Clang 18.

Integration tests were run using `ckb-testtool`, executing the contract
in the CKB VM. The test suite currently contains 10 tests, and all 10
passed in the latest run.

### Implemented State Script checks

The current prototype checks:

-   State script arguments are 32 bytes long.
-   Input and output data use the expected schema version and 34-byte
    format.
-   The item ID in the data matches the script arguments.
-   The status value is recognized.
-   Only the three permitted lifecycle transitions are accepted.
-   A transaction is rejected if the State Script group contains
    multiple input cells or multiple output cells.

### Test results

  Test area                                                   Result
  ---------------------------------------- -------------------------
  Valid lifecycle transitions                               3 passed
  Invalid transitions and malformed data                    6 passed
  Duplicate State output rejection                          1 passed
  **Total**                                  **10 passed, 0 failed**

The successful tests demonstrate the current prototype's behavior for
these specific cases. They do not establish that all security
requirements or lifecycle invariants have been implemented.

## 5. Current Limitations

The following work remains open:

-   **Authorization:** The integration tests currently use an
    `ALWAYS_SUCCESS` lock script. Admin authorization has not yet been
    implemented and verified.
-   **Cell property preservation:** Additional checks are needed to
    ensure that transaction outputs preserve required Lock Script and
    Type Script properties.
-   **Registry Script:** Registration, append-only behavior,
    duplicate-ID rejection, and Registry data integrity have not yet
    been implemented in a contract.
-   **Registry-State linkage:** The State Script does not yet verify
    that an item is registered in a trusted Registry.
-   **End-to-end lifecycle:** The complete lifecycle has not yet been
    tested across the full Registry and State architecture.
-   **Frontend integration:** The lifecycle contracts have not yet been
    integrated end-to-end with the React application and wallet flow.

Accordingly, the State Script should be treated as an initial technical
prototype rather than a completed or production-ready contract.

## 6. Planned Work for Week 10

Week 10 will focus on implementing and verifying the core lifecycle:

1.  Strengthen State Script invariants and add tests for Cell property
    preservation and relevant edge cases.
2.  Design and implement an authorization mechanism appropriate for the
    MVP's administrator model.
3.  Implement the Registry Script, including data validation,
    append-only updates, and duplicate-ID rejection.
4.  Define and implement the trust relationship between the Registry and
    State Cells.
5.  Expand integration tests to cover cross-script behavior, invalid
    transactions, and lifecycle invariants.
6.  Review the implementation against the MVP requirements before
    proceeding to broader application integration.

## 7. Week 9 Outcome

Week 9 established the initial project scope and design foundation, set
up the CKB Rust contract workspace, and produced a working State Script
prototype with 10 passing integration tests.

The next milestone is to strengthen the security and data-integrity
guarantees, implement the Registry Script, and verify the complete
lifecycle across the relevant scripts. Week 9 is therefore reported as a
design and technical-spike milestone, with the remaining security and
integration work explicitly carried into Week 10.
