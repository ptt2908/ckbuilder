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
item IDs and a State Cell for each item's current lifecycle state.
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

Integration tests were run with `ckb-testtool`, executing the contract
in the CKB VM. The test suite grew from 9 tests to 10 after adding a
test for duplicate State outputs. The latest run completed with **10
passed, 0 failed**.

### 4.1 Implemented State Script Checks

The current prototype checks:

-   State Script arguments are 32 bytes long.
-   Input and output data use the expected schema version and 34-byte
    format.
-   The item ID in the data matches the script arguments.
-   The status value is recognized.
-   Only the three permitted lifecycle transitions are accepted.
-   A transaction is rejected if the State Script group contains
    multiple input Cells or multiple output Cells.

### 4.2 Test Progress and Verification Checkpoints

  -----------------------------------------------------------------------------------
  Checkpoint              Scope                               Result
  ----------------------- ----------------------------------- -----------------------
  Initial successful      Valid lifecycle transitions,        9 passed, 0 failed
  integration run         invalid transitions, and malformed  
                          data                                

  Rebuild and regression  Rebuilt the State contract and      9 passed, 0 failed
  run                     reran the existing test suite       
                          against the refreshed binary        

  Duplicate-output test   Added                               10 passed, 0 failed
  added                   `rejects_duplicate_state_outputs`   
                          to check that a transaction with    
                          multiple output Cells in the same   
                          State Script group is rejected      
  -----------------------------------------------------------------------------------

The earlier 9-test suite covered the following cases:

-   `allows_available_to_borrowed`
-   `allows_borrowed_to_returned`
-   `allows_returned_to_available`
-   `rejects_available_to_returned`
-   `rejects_available_to_available`
-   `rejects_changed_item_id`
-   `rejects_invalid_schema_version`
-   `rejects_invalid_data_length`
-   `rejects_invalid_status`

The 10-test suite includes all nine cases above, plus:

-   `rejects_duplicate_state_outputs`

### 4.3 Latest Test Results

  -------------------------------------------------------------------------------------
  Test Case                           Expected Behavior         Result
  ----------------------------------- ------------------------- -----------------------
  `allows_available_to_borrowed`      Accept                    PASS
                                      `AVAILABLE -> BORROWED`   

  `allows_borrowed_to_returned`       Accept                    PASS
                                      `BORROWED -> RETURNED`    

  `allows_returned_to_available`      Accept                    PASS
                                      `RETURNED -> AVAILABLE`   

  `rejects_available_to_returned`     Reject an invalid         PASS
                                      transition                

  `rejects_available_to_available`    Reject an unchanged state PASS

  `rejects_changed_item_id`           Reject a mismatched item  PASS
                                      ID                        

  `rejects_invalid_schema_version`    Reject an unsupported     PASS
                                      schema version            

  `rejects_invalid_data_length`       Reject malformed data     PASS
                                      length                    

  `rejects_invalid_status`            Reject an unsupported     PASS
                                      status value              

  `rejects_duplicate_state_outputs`   Reject multiple output    PASS
                                      Cells in the same State   
                                      Script group              

  **Total**                                                     **10 passed, 0 failed**
  -------------------------------------------------------------------------------------

These tests validate the prototype's current behavior for the listed
transition, data-format, and State Script group-cardinality cases. They
do not establish that all security requirements or lifecycle invariants
have been implemented.

## 5. Current Limitations

The following work remains open:

-   **Authorization:** The integration tests currently use an
    `ALWAYS_SUCCESS` Lock Script. Admin authorization has not yet been
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
prototype. The contract was built for the RISC-V target and the latest
CKB VM integration test run passed all 10 tests.

The next milestone is to strengthen the security and data-integrity
guarantees, implement the Registry Script, and verify the complete
lifecycle across the relevant scripts. Week 9 is therefore reported as a
design and technical-spike milestone, with the remaining security and
integration work explicitly carried into Week 10.
