# CKBuilders Week 6 – xUDT Token Manager
**Program:** CKBuilders\
**Week:** 06\
**Reporting Period:** 28 September - 04 October 2026\
**Participant:** Pham Tan Thinh

During Week 6 of the CKBuilders program, I worked on a web application for managing xUDT tokens on the CKB Testnet. The application connects to a JoyID wallet and provides token balance queries, minting and transfer operations, transaction tracking, message signing, and a registry for managing multiple token identities.

## 1. Overview

The goal of this week was to extend the xUDT application from a single-token workflow into a more organized token management dashboard.

I focused on three main areas:

- **Code structure:** separating wallet and token state from UI components, and moving CKB-related operations into service functions.
- **Token management:** allowing users to save and switch between multiple xUDT Type Args configurations.
- **User interface:** organizing the main functions into a responsive dashboard.

The application is built with React and TypeScript and connects to CKB Testnet through the CCC SDK and JoyID wallet integration.

## 2. Features

- **JoyID wallet connection:** connect and disconnect a JoyID wallet using passkey authentication.
- **CKB and xUDT balance queries:** view the connected wallet's native CKB balance and the balance for the currently selected xUDT Type Args.
- **xUDT minting:** submit a mint transaction when the connected wallet meets the issuer authorization check.
- **xUDT transfers:** transfer xUDT tokens to another CKB address.
- **Transaction query and history:** query a transaction's status and block information, and review locally stored transaction records.
- **Off-chain message signing:** sign a text message with the connected wallet and verify the resulting signature.
- **Multi-token registry:** save token identities with display names, switch between saved tokens, rename entries, and remove entries. Registry data is stored in browser `localStorage`.
- **Responsive dashboard:** use the application through Dashboard, Tokens, Transactions, and Developer Tools sections, including a mobile navigation drawer.

## 3. Technology Stack

- **Frontend:** React 19 and TypeScript
- **Build tool:** Vite
- **CKB and wallet integration:** `@ckb-ccc/ccc` and `@ckb-ccc/connector-react`
- **Styling:** CSS
- **Local persistence:** browser `localStorage`

Package versions are defined in `frontend/package.json`.

## 4. Project Architecture

I organized the source code by responsibility so that the UI, application state, and CKB operations are easier to maintain.

```text
week-06/
├── evidence/
│   ├── 01-week6-initial-app-running.png
│   ├── 02-week6-xudt-manager-ui.png
│   ├── 03-recipient-xudt-balance.png
│   ├── 04-xudt-transfer-confirmed.png
│   └── 05-multi-token-registry.png
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── MessageSignCard.tsx
│   │   │   ├── MintForm.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TokenCard.tsx
│   │   │   ├── TokenRegistryCard.tsx
│   │   │   ├── TransferForm.tsx
│   │   │   ├── TxHistoryCard.tsx
│   │   │   ├── TxQueryCard.tsx
│   │   │   └── WalletCard.tsx
│   │   ├── config/
│   │   │   ├── network.ts
│   │   │   └── storageKeys.ts
│   │   ├── hooks/
│   │   │   ├── useTokenManager.ts
│   │   │   ├── useTokenRegistry.ts
│   │   │   ├── useTxHistory.ts
│   │   │   └── useWallet.ts
│   │   ├── services/
│   │   │   ├── txService.ts
│   │   │   └── xudtService.ts
│   │   ├── types/
│   │   │   ├── token.ts
│   │   │   └── transaction.ts
│   │   ├── utils/
│   │   │   ├── amount.ts
│   │   │   └── hex.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

### Main responsibilities

- **`components/`:** contains the dashboard UI, forms, and cards for wallet, token, transaction, and message-signing functions.
- **`hooks/`:** manages wallet state, the active token, the token registry, and transaction history.
- **`services/`:** contains functions for xUDT balance queries, mint and transfer operations, and transaction status queries.
- **`types/`:** defines the TypeScript data structures used by the application.
- **`utils/` and `config/`:** provide shared validation/formatting helpers and network or storage-key configuration.
- **`App.tsx`:** connects the main application state and components.

This structure keeps most presentation code separate from state management and CKB-related operations.

## 5. Getting Started

### Prerequisites

- Node.js and npm versions compatible with the Vite version used by this project.
- A modern browser and a JoyID wallet for wallet-connected functions.
- Access to CKB Testnet.

### Install dependencies

From the repository root, run:

```bash
cd week-06/frontend
npm install
```

On Windows, you can use `npm.cmd` if PowerShell does not run the `npm` command:

```powershell
npm.cmd install
```

### Run the development server

From `week-06/frontend`, run:

```bash
npm run dev
```

Or on Windows:

```powershell
npm.cmd run dev
```

Open the local URL shown in the terminal (Vite commonly uses `http://localhost:5173`).

### Build the application

```bash
npm run build
```

On Windows:

```powershell
npm.cmd run build
```

The build command runs the project's configured TypeScript and Vite build steps.

## 6. Usage Guide

### Connect a wallet

Open the application and use the wallet connection control to connect JoyID. Approve the connection through the wallet when prompted.

### View balances

After connecting, the dashboard displays the wallet information and native CKB balance. The Tokens section displays the xUDT balance associated with the active Type Args.

### Manage token identities

In the Tokens section:

1. Set the xUDT Type Args you want to work with.
2. Enter an optional display name in the Token Registry area.
3. Save the active token identity.
4. Use **Use Token** to switch to a saved entry.
5. Use **Rename** to change an entry's display name, or **Remove** to delete it from the local registry.

The registry stores token identity information in the browser. It does not create a token on-chain or transfer tokens between wallets.

### Mint xUDT tokens

Minting is restricted to an authorized issuer. The active Type Args must match the issuer identity expected by the application. Enter the recipient CKB address and amount, then submit the operation and approve it in JoyID.

### Transfer xUDT tokens

Enter the recipient's CKB address and the amount to transfer. Review the selected token and transaction details, then submit and approve the transaction through JoyID. After submission, use the transaction hash to check its status.

### Query transactions and view history

In the Transactions section, enter a transaction hash to query its status and available block information. The transaction history section displays records saved by the application in the browser. Clearing this history removes the local records; it does not reverse or delete on-chain transactions.

### Sign a message

In Developer Tools, enter a text message and use the message-signing function. The application requests a signature from the connected wallet and displays the signature verification result. Message signing is an off-chain action and is separate from an xUDT transaction.

## 7. Testing and Verification

The application was built and checked during development, and the main workflows were manually exercised on CKB Testnet.

### Build and code checks

- The frontend build completed successfully during development.
- The token-management hook was reviewed to clear the displayed balance when the active Type Args changes and to prevent stale asynchronous query results from replacing the current state.
- Type Args validation and duplicate detection in the token registry were reviewed in the source code.

### Manual verification

- Connected a JoyID wallet and retrieved wallet information on CKB Testnet.
- Tested xUDT balance querying and transfer flow. A transfer was confirmed on-chain, and the recipient balance was checked.
- Tested the multi-token registry by saving and switching between token identities. The registry was also checked after reloading the application.
- Completed the final verification checklist for the Week 6 application.

These checks cover the recorded workflows; they should not be taken as exhaustive testing of every possible wallet, network, or transaction condition.

## 8. Evidence

The `evidence/` directory contains screenshots captured during implementation and verification.

| File | Description |
| --- | --- |
| `01-week6-initial-app-running.png` | Initial application running in the local development environment. |
| `02-week6-xudt-manager-ui.png` | xUDT Token Manager dashboard interface. |
| `03-recipient-xudt-balance.png` | Recipient wallet and xUDT balance query result. |
| `04-xudt-transfer-confirmed.png` | xUDT transfer confirmation on CKB Testnet. |
| `05-multi-token-registry.png` | Token Registry showing multiple saved token identities and the active token. |

## 9. Security and Important Notes

- **Type Args and wallet addresses are different:** Type Args identify the xUDT token script configuration. They are not the recipient's CKB address.
- **Mint authorization:** minting requires the connected wallet to satisfy the issuer authorization check implemented by the application.
- **Transaction approval:** on-chain mint and transfer operations require wallet approval through JoyID.
- **Local data:** the token registry and transaction history are stored in browser `localStorage`. Clearing browser data can remove these local records, but it does not remove on-chain tokens or transactions.
- **Secrets:** do not put private keys, recovery phrases, or other wallet secrets in the frontend source code or project documentation.

## 10. Limitations and Future Improvements

### Current limitations

- Token registry and transaction history are stored locally in the browser and are not automatically synchronized across devices or browsers.
- Transaction queries depend on access to CKB Testnet RPC services, so results may be affected by network availability or latency.
- The registry focuses on token identity and display names; it does not currently provide a full on-chain token metadata catalog.

### Possible future improvements

- Add token metadata such as symbol, decimal precision, and icon.
- Add registry export and import for moving saved token identities between browsers.
- Consider support for additional CKB wallets.

## 11. Conclusion

During Week 6, I developed the xUDT Token Manager into a modular dashboard for connecting a JoyID wallet, querying CKB and xUDT balances, performing mint and transfer operations, checking transactions, signing messages, and managing multiple token identities. The implementation was organized into components, hooks, and services, and the main workflows were checked with the recorded evidence. This provides a foundation for further improvements to the application in later stages of the CKBuilders program.
