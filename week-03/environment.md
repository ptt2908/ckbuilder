# Week 3: Environment Assessment for Fiber Network

## 1. Current Environment
- **Operating System:** Windows 11 Pro / Enterprise (Microsoft Windows NT 10.0.26200.0)
- **Architecture:** AMD64 (x86_64)
- **Rust Toolchain:** Installed (`rustc 1.98.1`, `cargo 1.98.1`)
- **Docker:** Not installed / not available in PATH

## 2. Existing CKB Tools
- **Node.js:** v24.19.0
- **npm:** 11.17.0
- **pnpm:** 11.24.0
- **offckb:** 0.4.13 installed
- **CKB Binaries (standalone `ckb` / `ckb-cli`):** Not directly on PATH (managed via `offckb`)
- **CKB Devnet Status:** Local OffCKB Devnet RPC on port 8114 is configured from Weeks 1-2 (not currently running)

## 3. Existing Fiber-related Components
- **Fiber Binaries (`fnode`, `fcli`, `fiber`):** None found in PATH or workspace
- **Fiber Configuration:** No existing Fiber configurations or directories found

## 4. Missing Prerequisites
- Official Fiber node / CLI binaries or repository source code
- CKB Node / Devnet running to anchor Fiber payment channels
- Docker (if container deployment is chosen; however Rust/Cargo is available for source builds or pre-built binaries can be downloaded)

## 5. Recommended Next Step for Setting Up Fiber
1. Refer to official Fiber Network documentation (https://www.fiber.world/docs) for the recommended installation method.
2. Download precompiled release binaries for Windows AMD64 or build via Cargo inside `week-03`.
3. Verify `fnode` and `fcli` versions before proceeding with network setup and node initialization.
