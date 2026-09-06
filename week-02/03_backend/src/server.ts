import express from "express";
import { ckbClient } from "./ckb.js";

function serializeBigInt(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        serializeBigInt(val),
      ]),
    );
  }

  return value;
}

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CKBuilders CKB Backend",
  });
});

app.get("/api/ckb/network", async (_req, res) => {
  try {
    const tip = await ckbClient.getTip();

    res.json({
      network: "testnet",
      addressPrefix: ckbClient.addressPrefix,
      tip: tip.toString(),
    });
  } catch (error) {
    console.error("Failed to query CKB:", error);

    res.status(500).json({
      error: "Failed to query CKB",
    });
  }
});

app.get("/api/ckb/tip", async (_req, res) => {
  try {
    const tip = await ckbClient.getTip();

    res.json({
      tip: tip.toString(),
    });
  } catch (error) {
    console.error("Failed to query CKB tip:", error);

    res.status(500).json({
      error: "Failed to query CKB tip",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});

app.get("/api/ckb/transactions/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;

    const transaction = await ckbClient.getTransaction(txHash);

    if (!transaction) {
      res.status(404).json({
        error: "Transaction not found",
      });
      return;
    }

    res.json(serializeBigInt(transaction));
  } catch (error) {
    console.error("Failed to query CKB transaction:", error);

    res.status(500).json({
      error: "Failed to query CKB transaction",
    });
  }
});

app.get("/api/ckb/transactions/:txHash/status", async (req, res) => {
  try {
    const { txHash } = req.params;

    const transaction = await ckbClient.getTransaction(txHash);

    if (!transaction) {
      res.status(404).json({
        txHash,
        status: "not_found",
      });
      return;
    }

    res.json({
      txHash,
      status: transaction.status,
      blockNumber:
        transaction.blockNumber !== undefined
          ? transaction.blockNumber.toString()
          : null,
      txIndex:
        transaction.txIndex !== undefined
          ? transaction.txIndex.toString()
          : null,
    });
  } catch (error) {
    console.error("Failed to query transaction status:", error);

    res.status(500).json({
      error: "Failed to query transaction status",
    });
  }
});