# Week 11 Report - ReuseLoop Application Integration and Testnet Validation
**Reporting period:** 2 Nov - 8 Nov 2026   
**Participant:** Pham Tan Thinh  
**Program:** CKB Builder Track

## 1. Courses and Topics Completed

During Week 11, I focused on integrating the ReuseLoop application with
its CKB smart contracts and validating the complete item lifecycle on
CKB Testnet.

The main topics covered were:

-   **CKB TypeScript Serialization and Compatibility**
    -   Implementing TypeScript codecs to match the contract binary
        formats specified in CP11.1.
    -   Validating Registry and State Script arguments and cell data.
    -   Preserving byte order, fixed-length fields, hash types, and CKB
        Script hash behavior.
-   **Wallet and Transaction Integration**
    -   Connecting the application to JoyID on CKB Testnet using CCC.
    -   Separating transaction construction, local signing, and network
        submission into explicit user-reviewed steps.
    -   Displaying transaction hashes, fees, change, and confirmation
        status.
-   **Testnet Deployment and Item Registration**
    -   Verifying Registry and State contract binaries against their
        expected SHA-256 checksums.
    -   Deploying the contract code cells and initializing the Registry.
    -   Atomically registering an item in the Registry and creating its
        initial State cell.
-   **Item Lookup and Lifecycle Interface**
    -   Looking up an item by its 32-byte identifier.
    -   Displaying a locally generated QR code, live State, and recent
        on-chain history.
    -   Building, signing, and submitting Borrow, Confirm Return, and
        Make Available transactions.

## 2. Exercises and Practical Work

### 2.1. TypeScript Binary Compatibility

Implemented the application-side Registry and State codecs according to
the Week 10 contract specifications and the CP11.1 binary compatibility
audit.

The application validates Registry and State binary artifacts against
their expected SHA-256 checksums before using them. The verified artifact
checksums are:

-   Registry: `C45C0EDE3B95BF4A447FEC1AC18E7756175755D7F832AB964503E0EE19BC5A88`
-   State: `376A80EE27C79ACC762AB1D828F17AA15499F41B05C2C07067F4429032418A03`

These checks protect the transaction-building flow from using contract
binaries that do not match the reviewed artifacts.

### 2.2. JoyID Wallet and Transaction Signing

Integrated JoyID Testnet wallet connection and transaction signing
through CCC.

The application presents separate steps for reviewing an unsigned
transaction, requesting a local JoyID signature, and submitting the
signed transaction. The signing step does not broadcast the transaction.
Before submission, the application checks the transaction hash and live
input cells, and it displays fees, change, and the affected Registry or
State cells.

### 2.3. Testnet Contract Deployment and Registry Genesis

Deployed the Registry and State contract code cells on CKB Testnet.
The deployment transaction created:

-   Registry code cell: `0xeffd3bffa01e3c24ce114633be043fa3103549de542414877da21e119120a40c:0`
-   State code cell: `0xeffd3bffa01e3c24ce114633be043fa3103549de542414877da21e119120a40c:1`

The Registry Genesis transaction was confirmed in block `22,998,717`:

`0x5ba65a14e5f393589812f2ed5dfb00db68d12dbc8498d5fcf66c98493809bd6f`

The resulting Registry cell was independently inspected in the CKB
Testnet Explorer.

### 2.4. Atomic Item Registration

Registered one item by atomically updating the Registry and creating its
initial `AVAILABLE` State cell.

-   Item ID: `0x9f2e2c5938cb346f0d23e112bdf763ff21293285c98967afd181c261f09948c2`
-   Registry ID: `0x3b1f5c7ca40ccb35c054e850185398cb2b07b0b7bbfbf1eed4ee1d6265790b60`
-   Transaction hash: `0x851d6f428defd2871b0124ea3893249a24a2a30a09970463c4d2953381d71660`
-   Confirmation: block `22,999,622`

The transaction advanced the Registry item count from 1 to 2 and created
the initial State output with status `AVAILABLE`.

### 2.5. Item Lookup, QR, Status, and History

Implemented item lookup using the live Registry and State cells on CKB
Testnet. The lookup validates that the item is registered and that the
State cell is linked to the expected Registry and administrator lock.

The UI displays the current on-chain status, Registry and State cell
outpoints, capacities, and Script hashes. The QR code is generated in
the browser and encodes the Item ID. The UI also displays recent
committed State transactions as an audit history.

After lifecycle transactions, the lookup was refreshed to verify the
current live State. The final lookup returned `AVAILABLE` and showed the
registration and all three lifecycle transitions.

### 2.6. End-to-End Item Lifecycle on CKB Testnet

Completed the full lifecycle using the application and JoyID:

| Operation | State transition | Transaction hash | Confirmed block |
|---|---|---|---:|
| Borrow | `AVAILABLE` -> `BORROWED` | `0xd88b93213ffcacac9ba691dae189f77c5a631380549246df2a8afb9fa4aa51a1` | 22,999,649 |
| Confirm Return | `BORROWED` -> `RETURNED` | `0x3ac18f18c7831e44c369bae00282255adbfaa7f7b05e3bb572d062e0e5be2a1c` | 22,999,692 |
| Make Available | `RETURNED` -> `AVAILABLE` | `0x71574211cc4a674571b330ca9de6a1beb4215971d2e9911369e9e4865137a482` | 22,999,731 |

Each transaction consumed the current State cell and created its
successor. The Registry remained a read-only CellDep during lifecycle
transitions. The final State was verified as `AVAILABLE` in the
application, and the recent on-chain history showed the complete
lifecycle.

## 3. Verification Results

The following verification activities were completed:

  Verification                         Result
  -----------------------------------  --------------------------------
  Application production build         Passed
  Existing Vitest suite                 54 passed, 0 failed (8 files)
  Registry Genesis on CKB Testnet        Confirmed in block 22,998,717
  Atomic item registration               Confirmed in block 22,999,622
  Borrow transition                      Confirmed in block 22,999,649
  Confirm Return transition              Confirmed in block 22,999,692
  Make Available transition              Confirmed in block 22,999,731
  Final live item lookup                 `AVAILABLE`; history verified
  `git diff --check`                     No errors in tracked diff; line-ending warnings

The first production build exposed a TypeScript accumulator inference
error in lifecycle fee calculation. The reducer was updated to specify a
`bigint` accumulator, after which the production build passed.

Vite reported a non-blocking bundle-size warning: the minified JavaScript
bundle was approximately 797 KB, above the configured 500 KB warning
threshold. The build still completed successfully.

The line-ending check emitted Git warnings for `package.json` and
`package-lock.json` about LF-to-CRLF conversion. No whitespace errors
were reported.

## 4. Key Learnings

### 4.1. Explicit Separation of Build, Sign, and Submit

A transaction preview is not a signature, and a local signature is not a
Testnet submission. Keeping these steps separate gives the administrator
a clear opportunity to review the affected cells, status transition,
fee, and change before each action.

### 4.2. Live Cells Are the Source of Current Item Status

A displayed lookup is a snapshot. After a lifecycle transition is
confirmed, the item lookup must be refreshed to query the successor State
cell. The final refreshed result and transaction history matched the
confirmed Testnet lifecycle.

### 4.3. State Cell Lineage and Registry Dependencies

Each lifecycle transaction spends the previous State cell and creates a
successor State cell. The trusted Registry cell is included as a
read-only dependency, preserving the Registry while the item changes
status.

### 4.4. On-chain Records Do Not Prove Physical Events

CKB records the administrator-authorized status transitions. It does not
independently prove that a physical item was handed over, returned,
cleaned, or inspected. Those business events and any associated personal
information remain outside the on-chain cell data.

## 5. Challenges and Open Questions

### 5.1. Refreshing Status After a Transition

The lookup UI retains its previous result until another lookup is
requested. The final acceptance flow refreshed the item explicitly and
then verified `AVAILABLE` and the full transaction history. Automatic
refresh after a confirmed lifecycle transaction is a potential usability
improvement.

### 5.2. Bundle Size Warning

The production build succeeds, but the JavaScript bundle exceeds Vite's
500 KB warning threshold. Code splitting can be considered if the
application grows or load performance becomes a concern.

### 5.3. Administrator Authorization Model

The Week 11 MVP continues to use a single administrator wallet to
authorize item registration and all lifecycle transitions. Store and
customer confirmations are not independently represented on-chain.

### 5.4. Indexer and RPC Availability

Lookup and transaction history depend on Testnet RPC and indexer
responses. A submitted transaction may take time to receive block
confirmation. If submission outcome is uncertain, the transaction hash
must be checked before attempting any retry.

## 6. Plan for Next Week

Week 12 will focus on final verification, demo preparation, and
limitations documentation.

Planned activities:

1.  **Application and Transaction Verification**
    -   Exercise valid and invalid lifecycle transitions.
    -   Check authorization failures, duplicate submissions, and RPC
        errors.
    -   Confirm that pending, confirmed, and uncertain states are
        presented accurately.
2.  **Demo and Evidence Preparation**
    -   Prepare a concise demo flow for Registry Genesis, item
        registration, lookup, and the complete item lifecycle.
    -   Preserve screenshots, transaction hashes, and Explorer links as
        evidence.
3.  **Documentation and Limitations**
    -   Document the administrator authorization model and the
        distinction between on-chain status and physical-world events.
    -   Record remaining usability improvements and future work.
4.  **Optional Fiber Exploration**
    -   Explore Fiber only if a concrete payment or settlement use case
        and a feasible funded Testnet setup are available.

DOB/Spore was not added during Week 11 because the core lifecycle was
prioritized; the Week 11 plan treats that extension as optional.

------------------------------------------------------------------------

## Week 11 Final Result

Week 11 completed the ReuseLoop application integration and its core
Testnet lifecycle acceptance. The verified Registry and State binaries
were used to initialize the Registry and register an item. The item was
then borrowed, returned, and made available again through separate
JoyID-reviewed transactions.

The production build passed, the existing automated suite passed with
54 tests, and every lifecycle transition was confirmed on CKB Testnet.
The final live lookup displayed `AVAILABLE`, with the complete item
history available in the application.

This completes the Week 11 core workflow and establishes the basis for
Week 12 verification, demo preparation, and documentation.