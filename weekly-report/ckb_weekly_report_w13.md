# Week 13 Report - ReuseLoop Peer Review Readiness and WSL Build Verification

**Reporting period:** 16 Nov - 22 Nov 2026 (final closeout: 24 Nov 2026)  
**Participant:** Pham Tan Thinh  
**Program:** CKB Builder Track

## 1. Courses and Topics Completed

During Week 13, I focused on preparing ReuseLoop for peer review and verifying the CKB contract build in the actual WSL environment. The main topics covered were:

- **CKB RISC-V Build Toolchain**
  - Verifying Clang and the RISC-V Rust target in Ubuntu WSL.
  - Identifying the versioned LLVM archiver and object-copy tools required by this environment.
  - Rebuilding the Registry and State contracts and inspecting the resulting binaries.
- **JoyID Integration Review**
  - Reviewing the app's CCC-based JoyID Testnet connection and transaction-signing path.
  - Distinguishing existing integration and prior Testnet evidence from a fresh browser-level wallet check.
- **Peer Review Preparation**
  - Prioritizing reproducible builds and transaction safety checks while community review is pending.
  - Preparing to collect feedback through Nervos Talk and the Telegram group.

## 2. Exercises and Practical Work

### 2.1. WSL Clang Build Verification

Verified the build from the WSL terminal in `reuse-loop-contracts`. The environment has Ubuntu Clang 18.1.3 and the `riscv64imac-unknown-none-elf` Rust target. The build required explicit paths for the installed, versioned LLVM tools:

```sh
env CLANG=/usr/bin/clang make AR=/usr/bin/llvm-ar-18 OBJCOPY=/usr/bin/llvm-objcopy-18 build
```

Both `registry` and `state` compiled successfully. The generated release binaries were inspected with `file` and identified as statically linked RISC-V ELF executables. Their stripped sizes were approximately 54 KB for `registry` and 46 KB for `state`.

The default tool discovery still expects unversioned `/usr/bin/llvm-ar` and `/usr/bin/llvm-objcopy` paths, which are absent in this WSL installation. The successful command used one-run overrides; the Makefile or build instructions still need a reproducible toolchain fix.

### 2.2. JoyID Integration Status Review

Reviewed the existing wallet connection code. The app has a `connectJoyIdTestnet` path using CCC's public Testnet client, JoyID CKB signers, an explicit wallet connection, and the signer address. The Week 11 report also records Testnet lifecycle transitions using JoyID-reviewed transactions.

This Week 13 review was source-level only. A fresh browser test with a real JoyID session, including approval/cancel and pending/confirmed transaction behavior, remains to be completed. The integration is present; current work is to re-verify the end-to-end user flow and failure handling.

### 2.3. Nervos Talk Peer Review

The ReuseLoop project topic has been posted on Nervos Talk and is awaiting approval. After it is approved, the plan is to share it in the Telegram group and ask community members to support the review.

### 2.4. Review of Previous Verification Results

Week 12 recorded 62 passing app tests, 77 passing contract tests, and a successful production build. These are Week 12 results and were not rerun as part of this Week 13 build check. Week 13 independently verified the CKB RISC-V contract build in WSL.

## 3. Verification Results

| Check | Result |
|---|---|
| WSL Clang | Ubuntu Clang 18.1.3 available at `/usr/bin/clang` |
| Rust RISC-V target | `riscv64imac-unknown-none-elf` installed |
| Registry and State contract build | Passed with explicit versioned LLVM tool paths |
| Binary architecture | Both outputs are statically linked RISC-V ELF executables |
| Stripped binary sizes | `registry`: approximately 54 KB; `state`: approximately 46 KB |
| Week 12 app test suite | 62 passed, as reported in Week 12; not rerun this week |
| Week 12 contract test suite | 77 passed, as reported in Week 12; not rerun this week |
| JoyID real-browser smoke test | Pending |
| Nervos Talk approval | Pending |

## 4. Key Learnings

### 4.1. Tool Availability and Tool Discovery Are Separate

Clang was installed in WSL. The first build issue came from the contract build script needing an explicit `CLANG` path, followed by the Makefile deriving unversioned LLVM tool names that did not exist in this environment. Passing the installed versioned paths enabled a successful build without changing source files.

### 4.2. A Successful Build Is Not Yet a Reproducible Default Build

The binaries now build in WSL, but the default command still needs tool discovery or documented overrides so another developer can reproduce the result without manual path selection.

### 4.3. JoyID Code and a Fresh Wallet Test Provide Different Evidence

The JoyID connector exists in the app, and Week 11 records successful Testnet lifecycle transactions. A fresh browser smoke test is still needed to verify the current interface and cancellation, RPC, and transaction-status handling.

### 4.4. Keep Review Claims Aligned With the MVP

ReuseLoop remains a single-administrator Testnet prototype. Physical handover and other off-chain events are not proven by the blockchain, and the application does not provide escrow guarantees. Peer review should focus on transaction safety, the authorization model, artifact reproducibility, RPC/indexer behavior, and the Cell data display.

## 5. Challenges and Open Questions

### 5.1. Reproducible Build Setup

The current WSL build succeeds with explicit Clang 18 and versioned LLVM tool paths. The default Makefile path selection remains unresolved and should be fixed or documented before the artifact is treated as reproducible for reviewers.

### 5.2. Browser-Level Transaction Failure Coverage

Week 12 identified browser-level failure injection as outstanding. Wallet cancellation, RPC/network errors, and delayed or pending transactions should be exercised before considering the app flow fully reviewed.

### 5.3. Testnet Lookup and Artifact Location

Testnet transaction lookup can be delayed by RPC/indexer availability. The project should keep transaction references and built artifacts in a stable, reviewable location rather than relying on temporary storage.

### 5.4. UI and Bundle Follow-Up

Long Cell Data still needs a more usable expand/collapse treatment, and the production bundle-size warning remains. These are lower priority than transaction safety and build reproducibility and can be prioritized after peer feedback confirms their impact.

### 5.5. Community Feedback

The Nervos Talk post is awaiting approval, so community feedback has not yet been collected. Telegram outreach is planned after approval.

## 6. Plan for the Next Review Window

While waiting for community and team feedback:

1. **Make the contract build reproducible** - Fix tool discovery or document a stable toolchain path, then verify a clean WSL build.
2. **Re-verify JoyID in the browser** - Connect on Testnet and exercise signing, user cancellation, and transaction status tracking.
3. **Cover critical browser failures** - Check wallet cancellation, RPC failure, and delayed/pending transaction handling.
4. **Stabilize review artifacts** - Keep the binaries, demo guide, screenshots, and transaction references in a stable location for reviewers.
5. **Continue peer review outreach** - Once Nervos Talk approves the post, share it in the Telegram group and ask for review support.
6. **Prepare a status message for Neon** - Summarize Weeks 10-12 and Week 13 progress, open reliability work, and the Nervos/Telegram review plan.
7. **Triage review feedback** - Record priority, owner, and acceptance criteria. Address blockers and high-priority correctness or security issues first; then decide whether Cell Data controls or bundle optimization warrant follow-up.

## Week 13 Final Result

Week 13 independently verified that the Registry and State contracts can be built for CKB RISC-V in WSL using the installed Clang 18 and versioned LLVM tools. The app's JoyID Testnet connector is present, and Week 11 previously documented JoyID-reviewed Testnet lifecycle transactions; a fresh real-wallet browser smoke test remains open. The Nervos Talk post is awaiting approval. The main work to carry into the review window is a reproducible default build, browser-level wallet/RPC failure checks, and stable review artifacts, with UI and bundle improvements prioritized after peer feedback.
