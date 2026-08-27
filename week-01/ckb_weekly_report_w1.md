# CKB Weekly Report — Week 1

## 1. Week 1 Overview

The goal of Week 1 was to set up the local development environment for CKB, become familiar with basic CKB concepts, and complete the beginner exercise "Transfer CKB" using a local Devnet.

The exercise was completed through both the `offckb` CLI and the CKB Simple Transfer dApp.

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
| 05 | CLI Transfer Success | `evidence/05_ex1_transfer_success.png` |
| 06 | CLI Balance After Transfer | `evidence/06_ex1_balance_after.png` |
| 07 | Simple Transfer dApp Running | `evidence/07_simple_transfer_dapp_running.png` |
| 08 | Simple Transfer dApp | `evidence/08_simple_transfer_dapp.png` |
| 09 | dApp Transfer Success | `evidence/09_dapp_transfer_success.png` |
| 10 | dApp Balance After Transfer | `evidence/10_dapp_balance_after.png` |

The ten evidence screenshots are stored in the `evidence/` directory.

## 4. CKB Fundamentals

### Cell Model

The Cell Model is the fundamental state model of CKB. Blockchain state is represented by cells, which can be consumed by transactions and replaced by newly created cells.

### Capacity

Capacity represents the amount of CKBytes held by a cell. A cell must have sufficient capacity to cover the space occupied by its scripts and data. CKBytes are also the native token of the CKB network.

### Transaction

A transaction consumes existing input cells and creates new output cells, representing a state transition on the CKB blockchain.

### Input / Output

Inputs reference existing cells that are consumed by a transaction. Outputs define the new cells created by the transaction.

### Lock Script

A Lock Script defines the conditions required to unlock and consume a cell. It is commonly used to define ownership and authorization.

### Type Script

A Type Script is an optional script attached to a cell that validates transaction conditions and enforces rules related to the cell's data and state transitions.

### Data

Cell data stores application-specific information associated with a cell. It can be used to represent application state or other on-chain information.

### RPC

RPC (Remote Procedure Call) provides an interface for applications and development tools to communicate with a CKB node, including querying blockchain state and submitting transactions.

## 5. Exercise 1 — Transfer CKB

### Objective

The objective was to complete the beginner "Transfer CKB" exercise and learn how to transfer CKB between development accounts on a local CKB Devnet.

The transfer was performed using two approaches:

1. `offckb` CLI
2. CKB Simple Transfer dApp

### Environment

- Network: Local CKB Devnet
- Sender: Devnet Account #0
- Receiver: Devnet Account #1
- Transfer amount per transaction: 100 CKB

### Procedure

#### 1. CLI Transfer

A 100 CKB transfer was executed from Devnet Account #0 to Devnet Account #1 using the `offckb` CLI.

Transaction hash:

`0x7331bf4e510c8b0f11a7b0c4508138e81cf576f014056ad512868a884386cca4`

The resulting balances were then checked using `offckb balance`.

#### 2. Simple Transfer dApp

The CKB Simple Transfer example from the CKB documentation was run locally.

The dApp was configured to use the local Devnet and was used to perform another 100 CKB transfer from Account #0 to Account #1.

Transaction hash:

`0xc11fb49e957c6a19eebeab627ba0adaebab45c0d35f3245bc081bd150d71ebdb`

The balances were checked again after the dApp transaction.

### Result

Both 100 CKB transfers were successfully submitted to the local CKB Devnet.

The resulting balance changes were verified using the `offckb balance` command.

### Transaction

- CLI Transfer Hash:

  `0x7331bf4e510c8b0f11a7b0c4508138e81cf576f014056ad512868a884386cca4`

- dApp Transfer Hash:

  `0xc11fb49e957c6a19eebeab627ba0adaebab45c0d35f3245bc081bd150d71ebdb`

### Balance Verification

Initial balances before the two transfers:

- Account #0: 42,000,000 CKB
- Account #1: 42,000,000 CKB

Transfers:

- CLI transfer: 100 CKB
- dApp transfer: 100 CKB
- Total transferred: 200 CKB

Final balances:

- Account #0: 41,999,799.99999071 CKB
- Account #1: 42,000,200 CKB

The difference in Account #0 is approximately 200 CKB plus the transaction fees for the two transfers.

### What I Learned

I learned how to interact with a local CKB Devnet through both the `offckb` CLI and a frontend dApp.

I gained hands-on experience submitting CKB transactions, checking account balances, and observing how transaction fees affect the sender's balance.

I also gained a basic understanding of the CKB Cell Model and how transactions consume existing cells and create new cells.

### Evidence

- `evidence/05_ex1_transfer_success.png`
- `evidence/06_ex1_balance_after.png`
- `evidence/07_simple_transfer_dapp_running.png`
- `evidence/08_simple_transfer_dapp.png`
- `evidence/09_dapp_transfer_success.png`
- `evidence/10_dapp_balance_after.png`

## 6. Week 1 Development Log

| Date | Activity | Result | Evidence |
|---|---|---|---|
| Aug 27, 2026 | Workspace setup | Completed | `evidence/01_workspace_setup.png` |
| Aug 27, 2026 | OffCKB installation and verification | Completed | `evidence/02_offckb_installation.png` |
| Aug 27, 2026 | CKB Devnet startup | Completed | `evidence/03_ckb_devnet_running.png` |
| Aug 27, 2026 | Devnet account verification | Completed | `evidence/04_devnet_accounts.png` |
| Aug 27, 2026 | CLI CKB transfer | Completed | `evidence/05_ex1_transfer_success.png`, `evidence/06_ex1_balance_after.png` |
| Aug 28, 2026 | Simple Transfer dApp setup and execution | Completed | `evidence/07_simple_transfer_dapp_running.png`, `evidence/08_simple_transfer_dapp.png`, `evidence/09_dapp_transfer_success.png` |
| Aug 28, 2026 | Final balance verification | Completed | `evidence/10_dapp_balance_after.png` |

## 7. Remaining Week 1 Tasks

The Week 1 beginner exercise "Transfer CKB" has been completed.

The required practical work for this exercise has been documented with screenshots and recorded in the GitHub repository.

## 8. Final Reflection

Week 1 gave me a practical introduction to developing on Nervos CKB.

I set up a local CKB development environment, started a Devnet, worked with development accounts, and completed CKB transfers through both the command line and a frontend dApp.

The practical exercise helped me connect the basic CKB concepts with an actual transaction workflow, especially the relationship between cells, transactions, account balances, and transaction fees.

For the next stage, I will continue with the next beginner exercise and deepen my understanding of how CKB stores and validates on-chain state.