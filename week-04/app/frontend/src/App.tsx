import { ccc } from "@ckb-ccc/connector-react";
import {
  createSpore,
  findSporesBySigner,
} from "@ckb-ccc/spore";
import { useEffect, useState } from "react";

type SporeAsset = {
  id: string;
  contentType: string;
  content: string;
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

  // Message signing
  const [signMessage, setSignMessage] = useState("Hello CKBuilders!");
  const [signature, setSignature] = useState("");
  const [signType, setSignType] = useState("");
  const [verificationResult, setVerificationResult] = useState("");
  const [isSigningMessage, setIsSigningMessage] = useState(false);

  // Transaction query
  const [queryTxHash, setQueryTxHash] = useState("");
  const [queryTxStatus, setQueryTxStatus] = useState("");
  const [queryTxBlock, setQueryTxBlock] = useState("");
  const [isQueryingTx, setIsQueryingTx] = useState(false);

  // Spore
  const [spores, setSpores] = useState<SporeAsset[]>([]);
  const [isCreatingSpore, setIsCreatingSpore] =
    useState(false);
  const [sporeTxHash, setSporeTxHash] = useState("");

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
  // Transaction query
  // --------------------------------------------------

  const handleQueryTransaction = async () => {
    setErrorMessage("");
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

      // Wait for one confirmation before refreshing balances.
      await signer.client.waitTransaction(
        txHash,
        1,
      );

      await loadXudtBalance();

      const newBalance =
        await signer.getBalance();

      setBalance(newBalance);

      setXudtRecipient("");
      setXudtTransferAmount("");
    } catch (error) {
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
        });
      }

      setSpores(result);
    } catch (error) {
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

      await signer.client.waitTransaction(
        txHash,
        1,
      );

      await loadSpores();

      const newBalance =
        await signer.getBalance();

      setBalance(newBalance);
    } catch (error) {
      console.error(
        "Failed to create Spore:",
        error,
      );
    } finally {
      setIsCreatingSpore(false);
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

        {queryTxStatus && (
          <p>
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

            {sporeTxHash && (
              <p>
                Transaction:
                <br />
                <code>{sporeTxHash}</code>
              </p>
            )}

            <h3>Owned Spores</h3>

            {spores.length === 0 ? (
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
