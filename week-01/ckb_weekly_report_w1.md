# CKB Weekly Report — Week 1

## 1. Week 1 Overview

The goal of Week 1 is to set up the local development environment for CKB, understand the core concepts of the CKB blockchain, and perform basic operations on a local CKB Devnet.

## 2. Development Environment

- OS: Windows
- Node.js: v24.19.0
- npm: 11.17.0
- OffCKB: 0.4.13
- CKB: 0.208.0
- Repository: `D:\CKB_prj\ckbuilder`
- Git branch: `main`
- Devnet RPC: `http://127.0.0.1:8114`
- Devnet RPC Proxy: `http://127.0.0.1:28114`

## 3. Evidence

| ID | Evidence | File |
|---|---|---|
| 01 | Workspace Setup | `evidence/01_workspace_setup.png` |
| 02 | OffCKB Installation / Verification | `evidence/02_offckb_installation.png` |
| 03 | CKB Devnet Running | `evidence/03_ckb_devnet_running.png` |
| 04 | Devnet Accounts | `evidence/04_devnet_accounts.png` |
| 05 | Exercise 1 Transfer Success | `evidence/05_ex1_transfer_success.png` |
| 06 | Exercise 1 Balance After Transfer | `evidence/06_ex1_balance_after.png` |

The six evidence screenshots are stored in the `evidence/` directory.

## 4. CKB Fundamentals

### Cell Model

TODO

### Capacity

TODO

### Transaction

TODO

### Input / Output

TODO

### Lock Script

TODO

### Type Script

TODO

### Data

TODO

### RPC

TODO

## 5. Exercise 1 — Transfer CKB

### Objective

TODO

### Environment

- Sender: Devnet Account #0
- Receiver: Devnet Account #1

### Procedure

TODO

### Result

The transfer was successfully executed on the local CKB Devnet.

### Transaction

- Transaction hash: `0x7331bf4e510c8b0f11a7b0c4508138e81cf576f014056ad512868a884386cca4`

### Balance Verification

- Initial balance:
  - Account #0: 42,000,000 CKB
  - Account #1: 42,000,000 CKB
- Transfer amount: 100 CKB
- Final balance:
  - Account #0: 41999899.99999536 CKB
  - Account #1: 42000100 CKB
- The difference in Account #0 includes the transaction fee.

### What I Learned

TODO

### Evidence

- `evidence/05_ex1_transfer_success.png`
- `evidence/06_ex1_balance_after.png`

## 6. Week 1 Development Log

| Date | Activity | Result | Evidence |
|---|---|---|---|
| TODO | Workspace setup | TODO | `evidence/01_workspace_setup.png` |
| TODO | OffCKB installation/verification | TODO | `evidence/02_offckb_installation.png` |
| TODO | CKB Devnet startup | TODO | `evidence/03_ckb_devnet_running.png` |
| TODO | Devnet account verification | TODO | `evidence/04_devnet_accounts.png` |
| TODO | Exercise 1 CKB transfer | TODO | `evidence/05_ex1_transfer_success.png`, `evidence/06_ex1_balance_after.png` |

## 7. Remaining Week 1 Tasks

TODO

## 8. Final Reflection

TODO