# CKB Weekly Report - Week 1

**Reporting period:** 23 - 29 August 2026  
**Publication date:** 29 August 2026  
**Participant:** Pham Tan Thinh

## 1. Week 1 Overview

The goal of Week 1 was to set up the local development environment for CKB, become familiar with basic CKB concepts, and complete the beginner exercises.

The completed exercises for Week 1 are:

- Exercise 00: Getting Started
- Exercise 01: Transfer CKB
- Exercise 02: Store Data on Cell
- Exercise 03: Create Token
- Exercise 04: Create DOB
- Exercise 05: Simple Lock

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

| ID | Exercise | Evidence |
|---|---|---|
| 00 | Getting Started | [`00_setup/evidence/`](./00_setup/evidence/) |
| 01 | Transfer CKB | [`01_transfer_ckb/evidence/`](./01_transfer_ckb/evidence/) |
| 02 | Store Data on Cell | [`02_store_data_on_cell/evidence/`](./02_store_data_on_cell/evidence/) |
| 03 | Create Token | [`03_create_token/evidence/`](./03_create_token/evidence/) |
| 04 | Create DOB | [`04_create_dob/evidence/`](./04_create_dob/evidence/) |
| 05 | Simple Lock | [`05_simple-lock/evidence/`](./05_simple-lock/evidence/) |

All evidence screenshots are stored in their respective exercise directories.

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

## 5. Exercise 01 - Transfer CKB

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

See the [Exercise 01 evidence folder](./01_transfer_ckb/evidence/).

## 6. Exercise 05 - Simple Lock

### Objective

To build and deploy a custom hash-lock contract to the CKB Devnet, run its frontend, and successfully execute a transfer by providing the correct preimage.

### Procedure

- Built the JavaScript hash-lock contract successfully.
- Deployed `hash-lock.bc` successfully to the local CKB Devnet.
- Ran the Next.js frontend locally at `localhost:3000`.
- Deposited 300 CKB to the generated hash-lock address.
- Transferred 99 CKB using the hash-lock with the preimage "Hello World".

### Result

- The deployment transaction for `hash-lock.bc` was committed.
- The frontend deployment health became `READY`.
- The deposit of 300 CKB was confirmed.
- The final reveal and transfer transaction status was `committed`.

### What I Learned

I gained practical experience compiling and deploying a custom script to the Devnet, interacting with it via a local Next.js frontend, and unlocking a cell by revealing its correct preimage ("Hello World").

### Evidence

See the [Exercise 05 evidence folder](./05_simple-lock/evidence/).

## 7. Week 1 Development Log

| Date | Activity | Result | Evidence |
|---|---|---|---|
| Aug 27, 2026 | Workspace setup | Completed | [Exercise 00 evidence](./00_setup/evidence/) |
| Aug 27, 2026 | OffCKB installation and verification | Completed | [Exercise 00 evidence](./00_setup/evidence/) |
| Aug 27, 2026 | CKB Devnet startup | Completed | [Exercise 00 evidence](./00_setup/evidence/) |
| Aug 27, 2026 | Devnet account verification | Completed | [Exercise 00 evidence](./00_setup/evidence/) |
| Aug 27, 2026 | CLI CKB transfer | Completed | [Exercise 01 evidence](./01_transfer_ckb/evidence/) |
| Aug 28, 2026 | Simple Transfer dApp setup and execution | Completed | [Exercise 01 evidence](./01_transfer_ckb/evidence/) |
| Aug 28, 2026 | Final balance verification | Completed | [Exercise 01 evidence](./01_transfer_ckb/evidence/) |
| Aug 28, 2026 | Exercise 05: Simple Lock contract deployment and transfer | Completed | [Exercise 05 evidence](./05_simple-lock/evidence/) |

## 8. Challenges

The main challenges during Week 1 were:

- **Windows Development Environment:** Some CKB tooling used Unix-style executable paths. The `esbuild` build command initially failed on Windows and had to be adjusted to use the Windows executable.

- **CKB Cell Model:** Understanding the difference between the traditional account/balance model and CKB's Cell Model required some adjustment. The Transfer CKB exercise helped connect the concept with actual transactions.

- **CKB Script Workflow:** The Simple Lock exercise required understanding the workflow from building and deploying a script to depositing CKB and unlocking the cell with the correct preimage.

All challenges were resolved, and the Week 1 exercises were completed successfully.

## 9. Final Reflection

Week 1 gave me a practical introduction to developing on Nervos CKB.

I set up a local CKB development environment, started a Devnet, worked with development accounts, and completed CKB transfers through both the command line and a frontend dApp.

By progressing through the six beginner exercises, the practical work helped me connect basic CKB concepts with actual transaction workflows, understand the relationships between cells and transaction fees, and successfully build, deploy, and interact with a custom hash-lock smart contract.

I am now prepared to dive deeper into CKB application and script development.

## 10. Week 2 Goals - Building Applications on CKB

The main goal for Week 2 is to move from basic CKB usage to hands-on application development.

I will focus on understanding how JavaScript / TypeScript applications interact with CKB through **CCC (Common Chain Connector)**, while also beginning to explore CKB Script development with Rust.

### 10.1 Application Development with CCC

I will use CCC as the main entry point for learning how to build CKB applications.

My planned activities are:

- Explore the CCC App and understand its main features.
- Experiment with CKB transactions using the CCC Playground.
- Read and run relevant CCC examples.
- Learn the basic CCC API and its core concepts.
- Build simple CKB application flows using JavaScript / TypeScript.
- Understand how a frontend application connects to CKB and interacts with cells and transactions.

### 10.2 Introduction to Rust and CKB Scripts

After gaining more experience with application-level development, I will start learning how CKB Scripts are developed and executed.

The initial focus will be:

- Set up the Rust development environment for CKB.
- Explore the CKB Rust SDK and related examples.
- Learn the basic structure of a CKB Script.
- Understand Script arguments and execution.
- Build and test a simple Script.
- Explore the use of CKB-CLI and CKB Debugger during development and testing.

### 10.3 Supporting Tools

I will also become familiar with developer tools that are useful when working with CKB:

- CKB Testnet Faucet.
- CKB Debugger.
- CKB-CLI.
- CKB Tools.

These tools will be explored alongside the main development activities when they are needed.

### 10.4 Expected Outcome

By the end of Week 2, I aim to:

1. Understand the basic workflow of building a CKB application with JavaScript / TypeScript.
2. Be comfortable with the core concepts and APIs provided by CCC.
3. Build and test simple CKB application flows.
4. Understand the basic architecture and execution model of CKB Scripts.
5. Have a working Rust environment for further CKB Script development.
6. Be ready to move from beginner exercises toward building a small CKB-based project.
