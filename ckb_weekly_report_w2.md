# CKBuilder Weekly Report - Week 2

## 1. Overview

**Program:** CKBuilder  
**Week:** Week 2  
**Reporting Period:** 30 August - 5 September 2026  
**Participant:** Pham Tan Thinh

During Week 2, I moved from the basic CKB exercises completed in Week 1 to building applications with **JavaScript/TypeScript and CCC (Common Chain Connector)**.

### Project Links

- **Frontend:** [`week-02/02_frontend/ckb-learning-dapp`](./02_frontend/ckb-learning-dapp/)
- **Backend:** [`week-02/03_backend`](./03_backend/)

The main focus was to understand how CCC can be used to work with CKB Cells, addresses, signers, transactions, UDT tokens, Spore/DOBs, and Node.js backends. I also started connecting these concepts into a small React frontend and Node.js backend application.

The work followed the CCC learning path from the CKBuilder Handbook. Reference implementations and weekly reports from the CKB community, including the `ntudatit` CKB Playground report, were used as additional references for architecture and learning topics. The implementation and results in this report reflect my actual work and repository.

---

## 2. Week 2 Goals

The main goals for Week 2 were:

- Learn the role of **CCC** in CKB application development.
- Understand the CKB Cell Model through practical CCC operations.
- Learn the basic roles of `Client`, `Address`, `Signer`, and `Transaction`.
- Use CCC Playground to query CKB data.
- Build and complete CKB transactions with TypeScript.
- Sign and verify messages.
- Experiment with xUDT fungible tokens.
- Experiment with Spore/DOB digital objects.
- Learn how to use CCC from a Node.js backend.
- Build a basic React frontend and Node.js backend architecture.
- Connect the frontend to the backend for CKB network and transaction tracking.
- Start separating application-side logic from blockchain-side validation logic.

---

## 3. Development Environment

### Operating System

- Windows
- PowerShell

### CKB Environment

- CKB Testnet
- OffCKB Devnet for local development and xUDT testing
- CKB JSON-RPC

### Frontend

- React
- TypeScript
- Vite
- `@ckb-ccc/ccc`
- `@ckb-ccc/connector-react`

### Backend

- Node.js
- TypeScript
- Express
- `@ckb-ccc/shell`
- CORS

### Tools

- Git / GitHub
- pnpm
- CCC Playground
- CKB RPC

---

## 4. Week 2 Work Summary

| Area | Status | Implementation / Evidence |
|---|---|---|
| CCC Cell Model | Completed | Cell queries and transaction operations |
| CCC Signer | Completed | Address, balance, message signing, transaction signing |
| CCC Transaction | Completed | Build, complete, sign and broadcast transaction |
| CCC Client | Completed | Query balance, cells, transactions, tip and transaction data |
| CCC Address | Completed | Address to lock script conversion |
| CCC Playground | Completed | Balance, Cells and Transaction queries |
| Connect Wallets | Partial | React CCC Provider and wallet connector integrated |
| Compose Transactions | Partial | Transaction builder and preview implemented |
| Sign Messages | Completed | Sign and verify message |
| UDT Tokens | Completed | xUDT transfer on OffCKB Devnet |
| Spore Protocol | Completed | Create Spore on CKB Testnet |
| Node.js Backend | Completed | CKB RPC APIs and transaction tracking |
| Frontend + Backend | Completed | React frontend connected to Node.js backend |
| Own Application | In progress | React + Node.js CKB learning application |

---

# 5. CCC Core Concepts

## 5.1 CKB Cell Model

Week 2 continued the Cell Model concepts from Week 1 through direct CCC operations.

The React application can query live Cells from CKB Testnet using a lock script and display:

- OutPoint
- Capacity
- Type Script presence
- Data length

The application can also query transaction history associated with an address.

This made the Cell Model more concrete because the application directly observes live Cells and transactions rather than treating CKB as a simple account/balance system.

---

## 5.2 Signer

I implemented a Node.js TypeScript example using:

```ts
const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
```

The implementation successfully:

- Obtained the recommended CKB Testnet address.
- Queried the signer balance.
- Signed a message.
- Verified the signature.
- Detected an invalid message/signature combination.
- Signed a CKB transaction.
- Broadcast the transaction to CKB Testnet.

Message:

```text
Hello CKBuilders!
```

The signature verification results were:

```text
Valid signature: true
Invalid message: false
```

Transaction hash:

```text
0xfc5d257569a0d74db8adeb98973dfe43db487fe977e44b2596d1ebdb1644279a
```

Evidence:

```text
week-02/01_ccc/evidence/
├── 07_signer_address_balance.png
├── 08_signer_sign_message.png
├── 09_signer_sign_transaction.png
├── 10_transaction_committed.png
├── 10_transaction_committed_env.png
└── 11_sign_message_verify.png
```

---

## 5.3 Transaction

I used CCC to construct a transaction from an output definition and then complete the required inputs and fee:

```ts
ccc.Transaction.from(...)
tx.completeInputsByCapacity(signer)
tx.completeFeeBy(signer)
signer.signTransaction(tx)
client.sendTransaction(...)
```

The resulting transaction contained:

```text
Inputs: 1
Outputs: 2
Witnesses: 1
```

The transaction was successfully broadcast and committed on CKB Testnet.

This helped clarify the difference between:

1. Declaring the desired transaction outputs.
2. Completing the transaction with suitable inputs and capacity.
3. Completing the fee.
4. Signing the transaction.
5. Broadcasting the signed transaction.

---

## 5.4 Client

I used `ccc.ClientPublicTestnet` for direct CKB Testnet queries.

The application exercised:

- `getTip()`
- `getTransaction()`
- `getBalance()`
- `findCellsByLock()`
- `findTransactionsByLock()`

The same Client abstraction was later used by the Node.js backend.

---

## 5.5 Address

The frontend and backend examples used:

```ts
ccc.Address.fromString(address, client)
```

to convert a CKB address into its corresponding lock script for querying balances, Cells, and constructing transaction outputs.

---

# 6. CCC Playground

I used CCC Playground to become familiar with direct CKB queries and transaction-related operations.

The completed practical activities included:

- Query CKB balance.
- Query live Cells.
- Query transaction history.
- Construct CKB transaction data.

These exercises helped connect the CCC API with the underlying CKB Cell Model.

---

# 7. React Frontend with CCC

I created a React + TypeScript frontend application:

```text
week-02/02_frontend/ckb-learning-dapp
```

The application uses:

```tsx
<ccc.Provider>
  <App />
</ccc.Provider>
```

and CCC React hooks:

```ts
useCcc()
useSigner()
```

The frontend currently provides:

- CKB Testnet detection.
- Wallet connection UI.
- Connected wallet information.
- Address display.
- Balance display.
- Testnet balance query.
- Live Cell query.
- Transaction history query.
- CKB transaction builder.
- Transaction preview.
- Backend connection check.
- Transaction status tracking.

The application is therefore moving from isolated learning examples toward a reusable CKB application structure.

---

# 8. Wallet Connection

The frontend includes CCC wallet integration through:

```ts
const { open, disconnect, wallet } = useCcc();
const signer = useSigner();
```

The application can display the connected wallet and provide Connect / Disconnect controls.

The wallet integration was partially limited by wallet/provider compatibility in the current Windows environment. The CCC integration itself is implemented, but a complete production-style wallet flow was not used as a blocker for the remaining backend and CKB learning work.

Status:

```text
CCC Provider / React integration: Completed
Wallet UI: Completed
Real wallet signing flow: Partial
```

---

# 9. Compose CKB Transactions

The frontend contains a transaction builder where the user provides:

- Receiver address
- CKB amount

The application then:

1. Converts the receiver address into a lock script.
2. Creates a transaction output.
3. Completes inputs when a signer is available.
4. Completes the transaction fee.
5. Displays a transaction preview.

The preview includes:

```text
Inputs
Outputs
Receiver
Amount
```

The frontend transaction builder therefore demonstrates the transaction composition part of CCC.

The final wallet-signing and broadcasting flow from the React UI remains a future improvement because of the wallet connection limitation described above.

---

# 10. Sign Messages

Message signing was implemented using:

```ts
signer.signMessage("Hello CKBuilders!")
```

The resulting signature was verified using CCC.

Results:

```text
Valid signature: true
Invalid message: false
```

This demonstrated that message signing is separate from transaction broadcasting and can be used to prove control of an identity without creating a blockchain transaction.

---

# 11. xUDT Tokens

I implemented an xUDT transfer using CCC and OffCKB Devnet.

The flow was:

```text
Create xUDT transfer
        ↓
Complete xUDT inputs
        ↓
Complete CKB capacity
        ↓
Complete transaction fee
        ↓
Sign and broadcast
```

The token used 0 decimals, so the transfer amount was constructed with:

```ts
ccc.fixedPointFrom("100", 0)
```

The transaction was successfully committed:

```text
0xdb6446d680d987eb793fd28f568f038559c5d69bd1bc9772b53639e0d60694ea
```

Result:

```text
Sender:   900 tokens remaining
Receiver: 100 tokens received
```

During implementation, I encountered an issue caused by using the public Testnet system-script configuration with the local OffCKB Devnet. I resolved this by configuring the local Secp256k1Blake160 dependency to the OffCKB Devnet depGroup.

This was useful for understanding that transaction dependencies and system scripts must match the target CKB network.

Evidence:

```text
week-02/04_xudt/evidence/
├── 02_transaction_committed.png
└── 03_receiver_100_xudt.png
```

---

# 12. Spore Protocol

I implemented the Spore creation flow using the CCC Spore SDK.

The operation created a Spore with text content:

```text
Hello CKBuilders Spore!
```

Spore ID:

```text
0x5f55916aaa1d664159579bc4486fc1f978a341417d73a551109751a99e392d91
```

Transaction hash:

```text
0xea4074c88127ccb10798a6f10bd2fd0ac2ce71acabc7fd827cb8a1683078c257
```

The implementation initially used the local OffCKB Devnet, but the required Spore protocol dependencies were not available there. I therefore used CKB Testnet, where the required Spore dependencies were available.

This highlighted an important difference between a general-purpose local CKB development node and a network that already contains a deployed protocol such as Spore.

---

# 13. Node.js Backend

I created a Node.js + TypeScript backend:

```text
week-02/03_backend
```

The backend uses:

```text
Express
TypeScript
@ckb-ccc/shell
CORS
```

The current REST API includes:

```text
GET /api/health
GET /api/ckb/network
GET /api/ckb/tip
GET /api/ckb/transactions/:txHash
GET /api/ckb/transactions/:txHash/status
```

The backend connects to CKB Testnet through:

```ts
const ckbClient = new ccc.ClientPublicTestnet();
```

The backend successfully queried:

- CKB network information.
- Current chain tip.
- Full transaction information.
- Transaction confirmation status.

Because CCC transaction responses can contain JavaScript `bigint` values, a recursive serialization helper was added before returning transaction JSON responses.

---

# 14. Frontend - Backend Integration

The React frontend was connected to the Node.js backend through a small API client:

```text
week-02/02_frontend/ckb-learning-dapp/src/backendApi.ts
```

The frontend can query:

```text
/api/ckb/network
/api/ckb/transactions/:txHash/status
```

The resulting architecture is:

```text
React + TypeScript
        │
        │ HTTP
        ▼
Node.js + Express
        │
        │ CCC
        ▼
CKB Testnet
```

The frontend successfully displayed:

```text
Backend Network: testnet
Backend Tip: <current tip>
Backend connection successful.
```

Evidence:

```text
week-02/03_backend/evidence/
├── 06_frontend_backend_connection.png
└── 07_frontend_transaction_tracking.png
```

---

# 15. Transaction Tracking

A transaction tracking feature was added to the React frontend.

The user can enter a transaction hash and request its status from the backend.

The flow is:

```text
Transaction Hash
       ↓
React Frontend
       ↓
backendApi.ts
       ↓
Express Backend
       ↓
CCC Client
       ↓
CKB Testnet
```

A previously committed transaction was successfully queried from the UI.

Result:

```text
Status: committed
Block Number: 22331692
Transaction Index: 1
```

This demonstrates a practical separation between transaction submission and transaction lifecycle tracking.

---

# 16. Challenges

The main challenges during Week 2 were:

### 16.1 Understanding CCC Transaction Completion

A transaction created with the desired outputs is not automatically ready for signing.

CCC requires additional steps such as:

```ts
completeInputsByCapacity(...)
completeFeeBy(...)
```

Understanding this distinction helped clarify how transaction construction works on CKB.

### 16.2 Network-Specific Dependencies

The xUDT experiment initially used a public Testnet system-script configuration while connecting to local OffCKB Devnet. This caused dependency resolution problems.

The issue was resolved by configuring the appropriate local Devnet dependency.

The Spore experiment showed the opposite situation: the local Devnet did not contain the required Spore protocol dependencies, so CKB Testnet was used for the Spore operation.

### 16.3 Node.js BigInt Serialization

CKB transaction responses can contain `bigint` values. Returning the CCC response directly through Express caused JSON serialization errors.

I added a recursive serializer to convert BigInt values into strings before returning JSON.

### 16.4 Frontend - Backend CORS

The browser initially failed to call the backend because the frontend and backend were running on different local origins.

CORS support was added to the Express backend, after which the frontend successfully connected to the backend.

### 16.5 Wallet Compatibility

Wallet connection was affected by provider and environment compatibility on Windows. Instead of blocking the learning path, I continued the CCC and backend work using the Node.js signer and Testnet/Devnet environments.

---

# 17. Key Learnings

The most important lessons from Week 2 were:

1. **CCC provides a common application interface for CKB development.**

   It brings together clients, addresses, signers, transactions, wallets, and protocol SDKs.

2. **The CKB Cell Model becomes clearer through real transactions.**

   Balance queries, Cells, xUDT and Spore all operate through the Cell-based transaction model.

3. **Transaction construction and transaction signing are separate steps.**

   An application can construct and complete a transaction before it is signed by a wallet or signer.

4. **The Client is the bridge between the application and CKB RPC.**

   The same CCC Client concepts can be used in frontend applications and Node.js backend services.

5. **Wallet responsibilities should remain separate from backend responsibilities.**

   The backend used in this project performs CKB queries and transaction tracking rather than storing a user's wallet private key.

6. **Blockchain transaction state is asynchronous.**

   Broadcasting a transaction and confirming its committed status are different stages. The transaction tracking feature was implemented to reflect this lifecycle.

7. **Network-specific dependencies matter.**

   Local Devnet, Testnet, and protocol deployments can have different system-script and protocol dependency configurations.

8. **xUDT and Spore demonstrate how the CKB Cell Model can support different application-level assets.**

9. **JavaScript/TypeScript + CCC is suitable for application development, while Rust/CKB Script is the next layer for custom on-chain validation logic.**

---

# 18. Repository Structure

The Week 2 work is organized as:

```text
week-02/
├── 01_ccc/
│   └── evidence/
│
├── 02_frontend/
│   └── ckb-learning-dapp/
│
├── 03_backend/
│   ├── evidence/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
│
├── 04_xudt/
│   └── evidence/
│
├── 05_spore/
│   └── evidence/
│
└── 06_nodejs_backend/
    └── evidence/
```

---

# 19. Evidence

The main Week 2 evidence is stored alongside each practical exercise.

### CCC / Signer / Transaction

```text
week-02/01_ccc/evidence/
├── 07_signer_address_balance.png
├── 08_signer_sign_message.png
├── 09_signer_sign_transaction.png
├── 10_transaction_committed.png
├── 10_transaction_committed_env.png
└── 11_sign_message_verify.png
```

### Frontend

```text
week-02/02_frontend/ckb-learning-dapp/
```

The frontend application itself provides evidence for CCC React integration, queries, transaction composition, backend integration, and transaction tracking.

### Backend

```text
week-02/03_backend/evidence/
├── 01_backend_health.png
├── 02_ckb_network.png
├── 03_ckb_tip.png
├── 04_query_transaction.png
├── 05_transaction_status.png
├── 06_frontend_backend_connection.png
└── 07_frontend_transaction_tracking.png
```

### xUDT

```text
week-02/04_xudt/evidence/
├── 02_transaction_committed.png
└── 03_receiver_100_xudt.png
```

### Spore

```text
week-02/05_spore/evidence/
```

---

# 20. Remaining Tasks

The following items remain open after Week 2:

- Complete a real wallet signing flow in the React frontend when a compatible wallet environment is available.
- Extend the frontend transaction builder from preview to wallet signing and broadcasting.
- Continue improving the Own Application based on the CKBuilder program requirements.
- Begin the next learning phase: Rust and CKB Script fundamentals.

The remaining wallet work is not considered a blocker for progressing to the next CKB development layer.

---

# 21. Week 2 Outcome

By the end of Week 2, I moved from basic CKB exercises into practical application development with **TypeScript, React, CCC, and Node.js**.

The main result is a small CKB learning application with:

```text
React Frontend
      │
      ├── CCC
      │   ├── Address
      │   ├── Client
      │   ├── Signer
      │   └── Transaction
      │
      ▼
Node.js Backend
      │
      ├── CKB Network
      ├── Tip
      ├── Transaction Query
      └── Transaction Tracking
      │
      ▼
CKB Testnet
```

I also completed practical experiments with xUDT and Spore and gained a clearer understanding of how application-side JavaScript/TypeScript development differs from on-chain CKB Script validation.

The next major learning direction is therefore **Rust and CKB Script development**, following the progression recommended by the CKBuilder Handbook.
