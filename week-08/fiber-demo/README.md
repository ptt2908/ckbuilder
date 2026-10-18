# Fiber invoice lifecycle demo

Uses real FNN v0.9.1 Testnet RPC. The invoice script creates a 1 CKB invoice, parses it, checks its status, cancels it, and verifies the final status. The route script runs send_payment with dry_run=true against a public Testnet node to inspect route failure on a zero-channel node. Neither script opens a channel, submits a payment, or broadcasts a CKB transaction.

## Setup and run

Run setup-runtime.ps1 once. It copies the official v0.9.1 Windows binaries and Testnet config into runtime/, uses localhost-only RPC/P2P ports 18327/18328, and generates a fresh random demo key. The restart password is encrypted with Windows DPAPI for this Windows account. The key has no funds.

1. Run .\runtime\start-node.ps1 in a PowerShell window.
2. In a second PowerShell window, run .\run-invoice-demo.ps1.
3. Optionally run .\run-dry-run-demo.ps1 to see route preflight fail with zero outbound liquidity.
4. Stop FNN with Ctrl+C in the node window.

The invoice script prints fields and statuses, not the full invoice string or private key. The route script verifies that the dry run did not create a payment session. Do not copy the demo key to another environment or fund this node.

## Files

- setup-runtime.ps1: one-time isolated node setup.
- runtime/start-node.ps1: starts the local Testnet node.
- run-invoice-demo.ps1: repeatable invoice create/parse/status/cancel flow.
- run-dry-run-demo.ps1: repeatable dry-run route check.
- runtime/: local binaries, config, node database, encrypted key, and user-bound DPAPI password.

