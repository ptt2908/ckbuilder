import { ccc } from "@ckb-ccc/connector-react";
import {
  createSpore,
  findSporesBySigner,
  meltSpore,
  transferSpore,
} from "@ckb-ccc/spore";
import { useEffect, useState } from "react";

type ScriptInfo = {
  codeHash: string;
  hashType: string;
  args: string;
};

type SporeAsset = {
  id: string;
  contentType: string;
  content: string;
  lock?: ScriptInfo;
  type?: ScriptInfo;
};

type TransactionHistoryItem = {
  id: string;
  action: "Create Spore" | "Transfer Spore" | "Melt Spore" | "Transfer xUDT";
  txHash: string;
  status: "Submitted" | "Committed";
  timestamp: string;
  assetId?: string;
};

function App() {
  const {
    open,
    disconnect,
    wallet,
    signerInfo,
  } = ccc.useCcc();

  const signer = ccc.useSigner();

  // Wallet / CKB
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<bigint>();
  const [errorMessage, setErrorMessage] = useState("");

  // xUDT
  const [xudtTypeArgs, setXudtTypeArgs] = useState("");
  const [xudtBalance, setXudtBalance] = useState<bigint>();
  const [xudtRecipient, setXudtRecipient] = useState("");
  const [xudtTransferAmount, setXudtTransferAmount] =
    useState("");
  const [xudtTxHash, setXudtTxHash] = useState("");
  const [isTransferringXudt, setIsTransferringXudt] =
    useState(false);
  const [xudtTransferError, setXudtTransferError] = useState("");

  // Message signing
  const [signMessage, setSignMessage] = useState("Hello CKBuilders!");
  const [signature, setSignature] = useState("");
  const [signType, setSignType] = useState("");
  const [verificationResult, setVerificationResult] = useState("");
  const [isSigningMessage, setIsSigningMessage] = useState(false);

  // Transaction query
  const [queryTxHash, setQueryTxHash] = useState("");
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("ckb-asset-manager-transaction-history");
      return saved ? (JSON.parse(saved) as TransactionHistoryItem[]) : [];
    } catch (error) {
      console.warn("Could not restore transaction history:", error);
      return [];
    }
  });
  const [queryTxStatus, setQueryTxStatus] = useState("");
  const [queryTxError, setQueryTxError] = useState("");
  const [queryTxBlock, setQueryTxBlock] = useState("");
  const [isQueryingTx, setIsQueryingTx] = useState(false);

  // Spore
  const [spores, setSpores] = useState<SporeAsset[]>([]);
  const [sporeLastUpdated, setSporeLastUpdated] = useState("");
  const [isRefreshingSpores, setIsRefreshingSpores] = useState(false);
  const [sporeLoadError, setSporeLoadError] = useState("");
  const [isCreatingSpore, setIsCreatingSpore] =
    useState(false);
  const [sporeTxHash, setSporeTxHash] = useState("");
  const [sporeCreateError, setSporeCreateError] = useState("");
  const [selectedSporeId, setSelectedSporeId] = useState("");
  const [sporeRecipient, setSporeRecipient] = useState("");
  const [sporeTransferTxHash, setSporeTransferTxHash] = useState("");
  const [sporeTransferError, setSporeTransferError] = useState("");
  const [sporeTransferStatus, setSporeTransferStatus] = useState("");
  const [isTransferringSpore, setIsTransferringSpore] = useState(false);
  const [selectedMeltSporeId, setSelectedMeltSporeId] = useState("");
  const [sporeMeltTxHash, setSporeMeltTxHash] = useState("");
  const [sporeMeltError, setSporeMeltError] = useState("");
  const [sporeMeltStatus, setSporeMeltStatus] = useState("");
  const [isMeltingSpore, setIsMeltingSpore] = useState(false);

  // --------------------------------------------------
  // Load wallet information
  // --------------------------------------------------

  useEffect(() => {
    const loadWalletInfo = async () => {
      if (!signer) {
        setAddress("");
        setBalance(undefined);
        setXudtTypeArgs("");
        setXudtBalance(undefined);
        setSpores([]);
        setXudtTxHash("");
        return;
      }

      try {
        const addr = await signer.getRecommendedAddress();

        const { script: lock } =
          await signer.getRecommendedAddressObj();

        const args = lock.hash();

        const bal = await signer.getBalance();

        setAddress(addr);
        setBalance(bal);
        setXudtTypeArgs(args);
      } catch (error) {
        console.error(
          "Failed to load wallet information:",
          error,
        );
      }
    };

    loadWalletInfo();
  }, [signer]);

  // --------------------------------------------------
  // Load xUDT balance
  // --------------------------------------------------

  const loadXudtBalance = async () => {
    if (!signer || !xudtTypeArgs) {
      return;
    }

    try {
      const { script: lock } =
        await signer.getRecommendedAddressObj();

      const xudtType = await ccc.Script.fromKnownScript(
        signer.client,
        ccc.KnownScript.XUdt,
        xudtTypeArgs,
      );

      let total = 0n;

      for await (
        const cell of signer.client.findCellsByLock(
          lock,
          xudtType,
          true,
        )
      ) {
        if (cell.outputData) {
          const amount = ccc.numFromBytes(
            ccc.bytesFrom(cell.outputData),
          );

          total += amount;
        }
      }

      setXudtBalance(total);
    } catch (error) {
      console.error(
        "Failed to query xUDT balance:",
        error,
      );
    }
  };

  // --------------------------------------------------
  // Sign & verify message
  // --------------------------------------------------

  const handleSignMessage = async () => {
    setErrorMessage("");
    setSignature("");
    setSignType("");
    setVerificationResult("");

    try {
      if (!signer) {
        throw new Error("Connect JoyID first.");
      }

      const message = signMessage.trim();

      if (!message) {
        throw new Error("Message must not be empty.");
      }

      setIsSigningMessage(true);

      const result = await signer.signMessage(message);

      setSignature(result.signature);
      setSignType(result.signType);

      // Verify with the currently connected signer.
      // CCC's Signature object already contains the sign type,
      // so no separate sign-type argument is required.
      const verified = await signer.verifyMessage(
        message,
        result,
      );

      setVerificationResult(
        verified ? "Valid signature" : "Invalid signature",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      setErrorMessage(message);
      console.error("Failed to sign/verify message:", error);
    } finally {
      setIsSigningMessage(false);
    }
  };

  // --------------------------------------------------
  // Persistent transaction history
  // --------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        "ckb-asset-manager-transaction-history",
        JSON.stringify(transactionHistory),
      );
    } catch (error) {
      console.warn("Could not persist transaction history:", error);
    }
  }, [transactionHistory]);

  const recordTransaction = (
    action: TransactionHistoryItem["action"],
    txHash: string,
    assetId?: string,
  ) => {
    setTransactionHistory((current) => [
      {
        id: `${txHash}-${action}`,
        action,
        txHash,
        status: "Submitted",
        timestamp: new Date().toISOString(),
        ...(assetId ? { assetId } : {}),
      },
      ...current.filter((item) => item.txHash !== txHash),
    ]);
  };

  const updateTransactionStatus = (
    txHash: string,
    status: TransactionHistoryItem["status"],
  ) => {
    setTransactionHistory((current) =>
      current.map((item) =>
        item.txHash === txHash ? { ...item, status } : item,
      ),
    );
  };

  // --------------------------------------------------
  // Transaction query
  // --------------------------------------------------

  const handleQueryTransaction = async () => {
    setErrorMessage("");
    setQueryTxError("");
    setQueryTxStatus("");
    setQueryTxBlock("");

    try {
      if (!signer) {
        throw new Error("Connect JoyID first.");
      }

      const txHash = queryTxHash.trim();

      if (!txHash) {
        throw new Error("Transaction hash must not be empty.");
      }

      if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
        throw new Error(
          "Invalid transaction hash. Expected a 32-byte hash starting with 0x.",
        );
      }

      setIsQueryingTx(true);

      const transaction =
        await signer.client.getTransaction(txHash);

      if (!transaction) {
        setQueryTxStatus("Not found");
        return;
      }

      setQueryTxStatus(transaction.status);
      setQueryTxBlock(
        transaction.blockNumber !== undefined
          ? transaction.blockNumber.toString()
          : "Pending / not yet confirmed",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      setQueryTxError(message);
      setErrorMessage(message);
      console.error("Failed to query transaction:", error);
    } finally {
      setIsQueryingTx(false);
    }
  };

  // --------------------------------------------------
  // Transfer xUDT
  // --------------------------------------------------

  const transferXudt = async () => {
    if (!signer || !xudtTypeArgs) {
      return;
    }

    try {
      setIsTransferringXudt(true);
      setXudtTxHash("");
      setXudtTransferError("");

      if (!xudtRecipient.trim()) {
        throw new Error("Recipient address is required.");
      }

      if (!xudtTransferAmount.trim()) {
        throw new Error("Transfer amount is required.");
      }

      const amount = BigInt(xudtTransferAmount);

      if (amount <= 0n) {
        throw new Error(
          "Transfer amount must be greater than 0.",
        );
      }

      if (
        xudtBalance !== undefined &&
        amount > xudtBalance
      ) {
        throw new Error(
          "Insufficient xUDT balance.",
        );
      }

      // Resolve recipient address into a lock script.
      const { script: toLock } =
        await ccc.Address.fromString(
          xudtRecipient.trim(),
          signer.client,
        );

      // Resolve the xUDT type script.
      const xudtType =
        await ccc.Script.fromKnownScript(
          signer.client,
          ccc.KnownScript.XUdt,
          xudtTypeArgs,
        );

      // Resolve the xUDT script cell dependency.
      const code = (
        await signer.client.getCellDeps(
          (
            await signer.client.getKnownScript(
              ccc.KnownScript.XUdt,
            )
          ).cellDeps,
        )
      )[0].outPoint;

      const udt = new ccc.udt.Udt(
        code,
        xudtType,
      );

      // Build the xUDT transfer transaction.
      const { res: tx } = await udt.transfer(
        signer,
        [
          {
            to: toLock,
            amount,
          },
        ],
      );

      // Complete xUDT inputs and change.
      const completedTx = await udt.completeBy(
        tx,
        signer,
      );

      // Add CKB capacity and transaction fee.
      await completedTx.completeInputsByCapacity(
        signer,
      );
      await completedTx.completeFeeBy(signer);

      // Sign and broadcast.
      const txHash =
        await signer.sendTransaction(completedTx);

      console.log(
        "xUDT transfer transaction:",
        txHash,
      );

      setXudtTxHash(txHash);
      recordTransaction("Transfer xUDT", txHash);

      // Wait for one confirmation before refreshing balances.
      await signer.client.waitTransaction(
        txHash,
        1,
      );
      updateTransactionStatus(txHash, "Committed");

      await loadXudtBalance();

      const newBalance =
        await signer.getBalance();

      setBalance(newBalance);

      setXudtRecipient("");
      setXudtTransferAmount("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      setXudtTransferError(message);
      console.error(
        "Failed to transfer xUDT:",
        error,
      );
    } finally {
      setIsTransferringXudt(false);
    }
  };

  // --------------------------------------------------
  // Load Spore assets
  // --------------------------------------------------

  const loadSpores = async () => {
    if (!signer) {
      setSpores([]);
      return;
    }

    try {
      const result: SporeAsset[] = [];

      for await (
        const item of findSporesBySigner({
          signer,
        })
      ) {
        const contentType =
          item.sporeData.contentType;

        let content = "";

        try {
          if (
            contentType === "text/plain" &&
            item.sporeData.content
          ) {
            content = ccc.bytesTo(
              item.sporeData.content,
              "utf8",
            );
          }
        } catch (error) {
          console.error(
            "Failed to decode Spore content:",
            error,
          );

          content = "Unable to decode content";
        }

        result.push({
          id:
            item.spore.cellOutput.type?.args ??
            "Unknown",
          contentType,
          content,
          lock: item.spore.cellOutput.lock
            ? {
                codeHash: item.spore.cellOutput.lock.codeHash,
                hashType: item.spore.cellOutput.lock.hashType,
                args: item.spore.cellOutput.lock.args,
              }
            : undefined,
          type: item.spore.cellOutput.type
            ? {
                codeHash: item.spore.cellOutput.type.codeHash,
                hashType: item.spore.cellOutput.type.hashType,
                args: item.spore.cellOutput.type.args,
              }
            : undefined,
        });
      }

      setSpores(result);
      setSporeLoadError("");
      setSporeLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      setSporeLoadError(message);
      console.error(
        "Failed to load Spore assets:",
        error,
      );
    }
  };

  // --------------------------------------------------
  // Create Spore
  // --------------------------------------------------

  const createNewSpore = async () => {
    if (!signer) {
      return;
    }

    try {
      setIsCreatingSpore(true);
      setSporeTxHash("");
      setSporeCreateError("");

      const contentType = "text/plain";

      const content = ccc.bytesFrom(
        "Hello CKBuilders Spore!",
        "utf8",
      );

      const { tx, id } = await createSpore({
        signer,
        data: {
          contentType,
          content,
        },
      });

      console.log("Spore ID:", id);

      await tx.completeInputsByCapacity(signer);
      await tx.completeFeeBy(signer);

      const txHash =
        await signer.sendTransaction(tx);

      console.log(
        "Spore transaction:",
        txHash,
      );

      setSporeTxHash(txHash);
      recordTransaction("Create Spore", txHash, id);

      await signer.client.waitTransaction(
        txHash,
        1,
      );
      updateTransactionStatus(txHash, "Committed");

      await loadSpores();

      const newBalance =
        await signer.getBalance();

      setBalance(newBalance);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      setSporeCreateError(message);
      console.error(
        "Failed to create Spore:",
        error,
      );
    } finally {
      setIsCreatingSpore(false);
    }
  };


  // --------------------------------------------------
  // Transfer Spore
  // --------------------------------------------------

  const transferExistingSpore = async () => {
    if (!signer) {
      setSporeTransferError("Connect JoyID first.");
      setSporeTransferStatus("Transfer failed.");
      return;
    }

    try {
      setIsTransferringSpore(true);
      setSporeTransferError("");
      setSporeTransferTxHash("");
      setSporeTransferStatus("Preparing Spore transfer...");

      const id = selectedSporeId.trim();
      const recipient = sporeRecipient.trim();

      if (!id) {
        throw new Error("Select a Spore to transfer.");
      }

      if (!recipient) {
        throw new Error("Recipient address is required.");
      }

      const { script: toLock } = await ccc.Address.fromString(
        recipient,
        signer.client,
      );

      const { tx } = await transferSpore({
        signer,
        id,
        to: toLock,
      });

      setSporeTransferStatus("Completing transaction...");
      await tx.completeInputsByCapacity(signer);
      await tx.completeFeeBy(signer);

      setSporeTransferStatus("Waiting for JoyID passkey confirmation...");
      const txHash = await signer.sendTransaction(tx);
      setSporeTransferTxHash(txHash);
      recordTransaction("Transfer Spore", txHash, id);

      setSporeTransferStatus(
        "Transaction sent. Waiting for CKB confirmation...",
      );
      await signer.client.waitTransaction(txHash, 1);
      updateTransactionStatus(txHash, "Committed");

      await loadSpores();
      setSelectedSporeId("");

      const newBalance = await signer.getBalance();
      setBalance(newBalance);

      setSporeTransferStatus("Spore transferred successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      setSporeTransferError(message);
      setSporeTransferStatus("Transfer failed.");
      console.error("Failed to transfer Spore:", error);
    } finally {
      setIsTransferringSpore(false);
    }
  };

  // --------------------------------------------------
  // Melt Spore (irreversible)
  // --------------------------------------------------

  const refreshSpores = async () => {
    if (!signer || isRefreshingSpores) return;

    try {
      setIsRefreshingSpores(true);
      await loadSpores();
    } finally {
      setIsRefreshingSpores(false);
    }
  };

  const meltExistingSpore = async () => {
    if (!signer) {
      setSporeMeltError("Connect JoyID first.");
      setSporeMeltStatus("Melt failed.");
      return;
    }

    try {
      setIsMeltingSpore(true);
      setSporeMeltError("");
      setSporeMeltTxHash("");
      setSporeMeltStatus("Preparing Spore melt...");

      const id = selectedMeltSporeId.trim();
      if (!id) {
        throw new Error("Select a Spore to melt.");
      }

      setSporeMeltStatus("Completing transaction...");
      const { tx } = await meltSpore({ signer, id });
      await tx.completeFeeBy(signer);

      setSporeMeltStatus("Waiting for JoyID passkey confirmation...");
      const txHash = await signer.sendTransaction(tx);
      setSporeMeltTxHash(txHash);
      recordTransaction("Melt Spore", txHash, id);

      setSporeMeltStatus("Transaction sent. Waiting for CKB confirmation...");
      await signer.client.waitTransaction(txHash, 1);
      updateTransactionStatus(txHash, "Committed");

      await loadSpores();
      setSelectedMeltSporeId("");

      const newBalance = await signer.getBalance();
      setBalance(newBalance);

      setSporeMeltStatus("Spore melted successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      setSporeMeltError(message);
      setSporeMeltStatus("Melt failed.");
      console.error("Failed to melt Spore:", error);
    } finally {
      setIsMeltingSpore(false);
    }
  };

  // --------------------------------------------------
  // Load assets when wallet is connected
  // --------------------------------------------------

  useEffect(() => {
    if (signer && xudtTypeArgs) {
      loadXudtBalance();
      loadSpores();
    }
  }, [signer, xudtTypeArgs]);

  // --------------------------------------------------
  // Automatic Spore lifecycle tracking
  // --------------------------------------------------

  useEffect(() => {
    if (!signer || !xudtTypeArgs) return;

    const intervalId = window.setInterval(() => {
      loadSpores();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [signer, xudtTypeArgs]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div>
      <h1>CKB Asset Manager</h1>

      {signerInfo ? (
        <div>
          {/* Wallet */}
          <section>
            <h2>Wallet</h2>

            <p>
              Wallet:{" "}
              <strong>{wallet?.name}</strong>
            </p>

            <p>
              Status:{" "}
              <strong>Connected</strong>
            </p>

            <p>
              Address:
              <br />
              <code>{address}</code>
            </p>
          </section>

          {/* CKB */}
          <section>
            <h2>CKB</h2>

            <p>
              Balance:{" "}
              {balance !== undefined
                ? `${ccc.fixedPointToString(
                    balance,
                  )} CKB`
                : "Loading..."}
            </p>
          </section>

          {/* xUDT */}
          <section>
            <h2>xUDT</h2>

            <p>
              Type Args:
              <br />
              <code>{xudtTypeArgs}</code>
            </p>

            <p>
              Balance:{" "}
              {xudtBalance !== undefined
                ? `${xudtBalance.toString()} xUDT`
                : "Loading..."}
            </p>

            <h3>Transfer xUDT</h3>

            <p>
              <label>
                Recipient Address:
                <br />
                <input
                  type="text"
                  value={xudtRecipient}
                  onChange={(event) =>
                    setXudtRecipient(
                      event.target.value,
                    )
                  }
                  placeholder="ckb1..."
                  style={{
                    width: "100%",
                  }}
                />
              </label>
            </p>

            <p>
              <label>
                Amount:
                <br />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={xudtTransferAmount}
                  onChange={(event) =>
                    setXudtTransferAmount(
                      event.target.value,
                    )
                  }
                  placeholder="10"
                />
              </label>
            </p>

            <button
              onClick={transferXudt}
              disabled={
                isTransferringXudt ||
                !xudtRecipient ||
                !xudtTransferAmount
              }
            >
              {isTransferringXudt
                ? "Transferring xUDT..."
                : "Transfer xUDT"}
            </button>

            {xudtTransferError && (
              <p role="alert" style={{ color: "crimson" }}>
                <strong>Transfer Error:</strong> {xudtTransferError}
              </p>
            )}

            {xudtTxHash && (
              <p>
                Transaction:
                <br />
                <code>{xudtTxHash}</code>
              </p>
            )}
          </section>

          {/* Spore */}
                      <section>
        <h2>Transaction Query</h2>

        <p>
          Query a CKB Testnet transaction by its transaction hash.
        </p>

        <label>
          Transaction Hash:
          <br />
          <input
            type="text"
            value={queryTxHash}
            onChange={(event) => {
              setQueryTxHash(event.target.value);
              setQueryTxError("");
              setQueryTxStatus("");
              setQueryTxBlock("");
            }}
            placeholder="0x..."
            style={{ width: "100%" }}
          />
        </label>

        <p>
          <button
            type="button"
            onClick={handleQueryTransaction}
            disabled={!signer || isQueryingTx || !queryTxHash}
          >
            {isQueryingTx
              ? "Querying..."
              : "Query Transaction"}
          </button>
        </p>

        {isQueryingTx && (
          <p role="status">Querying transaction status from CKB Testnet...</p>
        )}

        {queryTxError && (
          <p role="alert" style={{ color: "crimson" }}>
            <strong>Transaction query failed:</strong> {queryTxError}
            <br />
            Check the transaction hash, wallet connection, and network, then try again.
          </p>
        )}

        {queryTxStatus && (
          <p role="status">
            <strong>Status:</strong> {queryTxStatus}
          </p>
        )}

        {queryTxBlock && (
          <p>
            <strong>Block:</strong> {queryTxBlock}
          </p>
        )}
      </section>

      <section>
        <h2>Transaction History</h2>
        <p>
          Locally saved transactions submitted through this app. This is not a
          complete on-chain history and is stored only in this browser.
        </p>
        {transactionHistory.length === 0 ? (
          <p>No locally recorded transactions yet.</p>
        ) : (
          <div>
            {transactionHistory.map((item) => (
              <article key={item.id}>
                <p>
                  <strong>Action:</strong> {item.action}
                  <br />
                  <strong>Status:</strong> {item.status}
                  <br />
                  <strong>Date:</strong> {new Date(item.timestamp).toLocaleString()}
                  {item.assetId && (
                    <>
                      <br />
                      <strong>Spore ID:</strong> <code>{item.assetId}</code>
                    </>
                  )}
                  <br />
                  <strong>Transaction Hash:</strong>
                  <br />
                  <code style={{ wordBreak: "break-all" }}>{item.txHash}</code>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQueryTxHash(item.txHash);
                    setQueryTxError("");
                    setQueryTxStatus("");
                    setQueryTxBlock("");
                  }}
                >
                  Check Transaction
                </button>
              </article>
            ))}
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear local history only? This will not affect blockchain transactions.")) {
                  setTransactionHistory([]);
                }
              }}
            >
              Clear Local History
            </button>
          </div>
        )}
      </section>

<section>
        <h2>Message Signing</h2>

        <label>
          Message:
          <input
            value={signMessage}
            onChange={(event) => {
              setSignMessage(event.target.value);
              setSignature("");
              setVerificationResult("");
            }}
          />
        </label>

        <button
          type="button"
          onClick={handleSignMessage}
          disabled={!signer || isSigningMessage}
        >
          {isSigningMessage
            ? "Signing..."
            : "Sign & Verify Message"}
        </button>

        {signType && (
          <p>
            <strong>Sign Type:</strong> {signType}
          </p>
        )}

        {signature && (
          <p style={{ wordBreak: "break-all" }}>
            <strong>Signature:</strong> {signature}
          </p>
        )}

        {verificationResult && (
          <p>
            <strong>Verification:</strong>{" "}
            {verificationResult}
          </p>
        )}

        {errorMessage && (
          <p>
            <strong>Error:</strong> {errorMessage}
          </p>
        )}
      </section>

<section>
            <h2>Spore</h2>

            <button
              onClick={createNewSpore}
              disabled={isCreatingSpore}
            >
              {isCreatingSpore
                ? "Creating Spore..."
                : "Create Spore"}
            </button>

            {sporeCreateError && (
              <p role="alert" style={{ color: "crimson" }}>
                <strong>Create Spore Error:</strong> {sporeCreateError}
              </p>
            )}

            {sporeTxHash && (
              <p>
                Transaction:
                <br />
                <code>{sporeTxHash}</code>
              </p>
            )}

            <h3>Transfer Spore</h3>

            <p>
              <label>
                Select Spore:
                <br />
                <select
                  value={selectedSporeId}
                  onChange={(event) => {
                    setSelectedSporeId(event.target.value);
                    setSporeTransferTxHash("");
                    setSporeTransferError("");
                  }}
                  disabled={isTransferringSpore || spores.length === 0}
                  style={{ width: "100%" }}
                >
                  <option value="">Select an owned Spore</option>
                  {spores.map((spore) => (
                    <option key={spore.id} value={spore.id}>
                      {spore.id}
                    </option>
                  ))}
                </select>
              </label>
            </p>

            <p>
              <label>
                Recipient Address:
                <br />
                <input
                  type="text"
                  value={sporeRecipient}
                  onChange={(event) => {
                    setSporeRecipient(event.target.value);
                    setSporeTransferTxHash("");
                    setSporeTransferError("");
                  }}
                  placeholder="ckt1... or ckb1..."
                  disabled={isTransferringSpore}
                  style={{ width: "100%" }}
                />
              </label>
            </p>

            <button
              type="button"
              onClick={transferExistingSpore}
              disabled={
                !signer ||
                isTransferringSpore ||
                !selectedSporeId ||
                !sporeRecipient.trim()
              }
            >
              {isTransferringSpore ? "Transferring Spore..." : "Transfer Spore"}
            </button>

            {sporeTransferStatus && (
              <p>
                <strong>Status:</strong> {sporeTransferStatus}
              </p>
            )}

            {sporeTransferTxHash && (
              <p style={{ wordBreak: "break-all" }}>
                <strong>Transfer Transaction:</strong>
                <br />
                <code>{sporeTransferTxHash}</code>
              </p>
            )}

            {sporeTransferError && (
              <p>
                <strong>Transfer Error:</strong> {sporeTransferError}
              </p>
            )}

            <h3>Melt Spore</h3>

            <p>
              <strong>Warning:</strong> Melting is irreversible. The selected
              Spore will be destroyed and its locked CKB capacity reclaimed.
            </p>

            <p>
              <label>
                Select Spore to Melt:
                <br />
                <select
                  value={selectedMeltSporeId}
                  onChange={(event) => {
                    setSelectedMeltSporeId(event.target.value);
                    setSporeMeltTxHash("");
                    setSporeMeltError("");
                    setSporeMeltStatus("");
                  }}
                  disabled={isMeltingSpore || spores.length === 0}
                  style={{ width: "100%" }}
                >
                  <option value="">Select an owned Spore</option>
                  {spores.map((spore) => (
                    <option key={spore.id} value={spore.id}>
                      {spore.id}
                    </option>
                  ))}
                </select>
              </label>
            </p>

            <button
              type="button"
              onClick={meltExistingSpore}
              disabled={!signer || isMeltingSpore || !selectedMeltSporeId}
            >
              {isMeltingSpore ? "Melting Spore..." : "Melt Spore"}
            </button>

            {sporeMeltStatus && (
              <p>
                <strong>Status:</strong> {sporeMeltStatus}
              </p>
            )}

            {sporeMeltTxHash && (
              <p style={{ wordBreak: "break-all" }}>
                <strong>Melt Transaction:</strong>
                <br />
                <code>{sporeMeltTxHash}</code>
              </p>
            )}

            {sporeMeltError && (
              <p>
                <strong>Melt Error:</strong> {sporeMeltError}
              </p>
            )}

            <h3>Owned Spores</h3>

            <button
              type="button"
              onClick={refreshSpores}
              disabled={!signer || isRefreshingSpores}
            >
              {isRefreshingSpores ? "Refreshing..." : "Refresh Spores"}
            </button>

            <p>
              <strong>Tracking:</strong> Auto-refresh every 15 seconds
              {sporeLastUpdated && (
                <>{" "}· Last updated: {sporeLastUpdated}</>
              )}
            </p>

            {isRefreshingSpores && (
              <p role="status">Refreshing owned Spore list...</p>
            )}

            {sporeLoadError && (
              <p role="alert" style={{ color: "crimson" }}>
                <strong>Could not refresh Spore list:</strong> {sporeLoadError}
                <br />
                Check the wallet connection and RPC/network, then try Refresh Spores again.
              </p>
            )}

            {!sporeLoadError && spores.length === 0 ? (
              <p>No Spore assets found.</p>
            ) : (
              <ul>
                {spores.map((spore) => (
                  <li key={spore.id}>
                    <p>
                      <strong>Spore ID:</strong>
                      <br />
                      <code>{spore.id}</code>
                    </p>

                    <p>
                      <strong>
                        Content Type:
                      </strong>{" "}
                      {spore.contentType}
                    </p>

                    {spore.content && (
                      <p>
                        <strong>
                          Content:
                        </strong>{" "}
                        {spore.content}
                      </p>
                    )}

                    <details>
                      <summary>Inspect Lock Script &amp; Type Script</summary>
                      <div>
                        <h4>Lock Script</h4>
                        {spore.lock ? (
                          <>
                            <p><strong>Code Hash:</strong><br /><code style={{ wordBreak: "break-all" }}>{spore.lock.codeHash}</code></p>
                            <p><strong>Hash Type:</strong> {spore.lock.hashType}</p>
                            <p><strong>Args:</strong><br /><code style={{ wordBreak: "break-all" }}>{spore.lock.args}</code></p>
                          </>
                        ) : <p>Lock Script information is unavailable.</p>}

                        <h4>Type Script</h4>
                        {spore.type ? (
                          <>
                            <p><strong>Code Hash:</strong><br /><code style={{ wordBreak: "break-all" }}>{spore.type.codeHash}</code></p>
                            <p><strong>Hash Type:</strong> {spore.type.hashType}</p>
                            <p><strong>Args:</strong><br /><code style={{ wordBreak: "break-all" }}>{spore.type.args}</code></p>
                          </>
                        ) : <p>Type Script information is unavailable.</p>}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <br />

          <button onClick={disconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <p>Status: Not connected</p>

          <button onClick={open}>
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
