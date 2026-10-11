# CKB Studio — xUDT Token Manager

A React + TypeScript + Vite web application for managing CKB xUDT tokens on **CKB Testnet** with JoyID passkey wallet integration, a persistent network-aware Multi-token Registry, token minting/transferring, and on-chain transaction lookup.

## Prerequisites

- **Node.js**: `^20.19.0 || >=22.12.0` (Node 22 LTS recommended)
- **npm**: v10+

## Installation

From `week-06/frontend`:

```bash
npm ci
```

*(or `npm install` when updating dependencies locally).*

## Development, Testing & Verification

Run the following scripts from `week-06/frontend`:

```bash
# Start local Vite dev server
npm run dev

# Run deterministic unit, hook, and UI tests (Vitest + React Testing Library)
npm test

# Run ESLint checks
npm run lint

# Run TypeScript project-reference typecheck
npx tsc -b

# Build production bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

## Environment Configuration (Optional)

The application defaults to **CKB Testnet** out of the box without requiring any environment file. To customize public network endpoints, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Supported public variables:

| Variable | Default | Description |
|---|---|---|
| `VITE_CKB_NETWORK_NAME` | `CKB Testnet` | Display label for the active CKB network |
| `VITE_CKB_NETWORK_ID` | `ckb_testnet` | Default network identifier for the Multi-token Registry |
| `VITE_CKB_EXPLORER_URL` | `https://v1.testnet.explorer.nervos.org` | Base URL for CKB Explorer transaction links |
| `VITE_CKB_RPC_URL` | *(CCC default Testnet RPC)* | Optional custom public CKB Testnet JSON-RPC endpoint passed to `ccc.Provider` |

> **Security Warning**: All `VITE_*` variables are statically embedded into the client-side browser bundle at build time. **Never** place private keys, seed phrases, wallet credentials, or secret API tokens in `VITE_*` variables or commit `.env` / `.env.local` files.

## Static Hosting & Deployment

1. Build the static production bundle from `week-06/frontend`:
   ```bash
   npm run build
   ```
2. Deploy the generated `week-06/frontend/dist` directory to any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).
3. Configure **SPA fallback** (`/* -> /index.html`, HTTP 200) on the host so direct navigation resolves to `index.html`.
