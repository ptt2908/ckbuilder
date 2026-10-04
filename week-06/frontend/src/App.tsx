import { useEffect, useState } from "react";
import "./App.css";

import { Header } from "./components/Header";
import { MessageSignCard } from "./components/MessageSignCard";
import { MintForm } from "./components/MintForm";
import { Sidebar } from "./components/Sidebar";
import { TokenCard } from "./components/TokenCard";
import { TokenRegistryCard } from "./components/TokenRegistryCard";
import { TransferForm } from "./components/TransferForm";
import { TxHistoryCard } from "./components/TxHistoryCard";
import { TxQueryCard } from "./components/TxQueryCard";
import { WalletCard } from "./components/WalletCard";
import { useTokenManager } from "./hooks/useTokenManager";
import { useTokenRegistry } from "./hooks/useTokenRegistry";
import { useTxHistory } from "./hooks/useTxHistory";
import { useWallet } from "./hooks/useWallet";
import { queryTransaction } from "./services/txService";
import {
  mintXudtTokens,
  transferXudtTokens,
} from "./services/xudtService";

function App() {
  const {
    open,
    disconnect,
    wallet,
    signerInfo,
    signer,
    address,
    balance,
    myLockHash,
    refreshWalletInfo,
  } = useWallet();

  const {
    xudtTypeArgs,
    setXudtTypeArgs,
    xudtBalance,
    loadXudtBalance,
  } = useTokenManager(signer, myLockHash);

  const {
    tokens: registryTokens,
    addToken: addRegistryToken,
    renameToken: renameRegistryToken,
    removeToken: removeRegistryToken,
    hasTokenWithTypeArgs: hasRegistryTokenWithTypeArgs,
  } = useTokenRegistry();

  const {
    transactionHistory,
    recordTransaction,
    updateTransactionStatus,
    clearHistory,
  } = useTxHistory();

  // Navigation state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Error & Operation States
  const [errorMessage, setErrorMessage] = useState("");

  // Transfer state
  const [xudtRecipient, setXudtRecipient] = useState("");
  const [xudtTransferAmount, setXudtTransferAmount] = useState("");
  const [xudtTxHash, setXudtTxHash] = useState("");
  const [isTransferringXudt, setIsTransferringXudt] = useState(false);
  const [xudtTransferError, setXudtTransferError] = useState("");

  // Mint state
  const [xudtMintRecipient, setXudtMintRecipient] = useState("");
  const [xudtMintAmount, setXudtMintAmount] = useState("");
  const [xudtMintTxHash, setXudtMintTxHash] = useState("");
  const [isMintingXudt, setIsMintingXudt] = useState(false);
  const [xudtMintError, setXudtMintError] = useState("");

  // Message signing state
  const [signMessage, setSignMessage] = useState("Hello CKBuilders!");
  const [signature, setSignature] = useState("");
  const [signType, setSignType] = useState("");
  const [verificationResult, setVerificationResult] = useState("");
  const [isSigningMessage, setIsSigningMessage] = useState(false);

  // Transaction query state
  const [queryTxHash, setQueryTxHash] = useState("");
  const [queryTxStatus, setQueryTxStatus] = useState("");
  const [queryTxError, setQueryTxError] = useState("");
  const [queryTxBlock, setQueryTxBlock] = useState("");
  const [isQueryingTx, setIsQueryingTx] = useState(false);

  // Sync token recipient default
  useEffect(() => {
    if (!signer) {
      setXudtTxHash("");
      setXudtMintRecipient("");
      setXudtMintTxHash("");
    }
  }, [signer]);

  useEffect(() => {
    if (address) {
      setXudtMintRecipient((prev) => prev || address);
    }
  }, [address]);

  // Transfer Handler
  const transferXudt = async () => {
    if (!signer || !xudtTypeArgs) {
      return;
    }

    try {
      setIsTransferringXudt(true);
      setXudtTxHash("");
      setXudtTransferError("");

      if (!xudtTransferAmount.trim()) {
        throw new Error("Transfer amount is required.");
      }

      const amount = BigInt(xudtTransferAmount);

      const txHash = await transferXudtTokens(
        signer,
        xudtTypeArgs,
        xudtRecipient,
        amount,
        xudtBalance,
      );

      console.log("xUDT transfer transaction:", txHash);

      setXudtTxHash(txHash);
      recordTransaction("Transfer xUDT", txHash);

      await signer.client.waitTransaction(txHash, 1);
      updateTransactionStatus(txHash, "Committed");

      await loadXudtBalance();
      await refreshWalletInfo();

      setXudtRecipient("");
      setXudtTransferAmount("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      setXudtTransferError(message);
      console.error("Failed to transfer xUDT:", error);
    } finally {
      setIsTransferringXudt(false);
    }
  };

  // Mint Handler
  const mintXudt = async () => {
    if (!signer || !xudtTypeArgs) {
      return;
    }

    try {
      setIsMintingXudt(true);
      setXudtMintTxHash("");
      setXudtMintError("");

      if (!xudtMintAmount.trim()) {
        throw new Error("Mint amount is required.");
      }

      const amount = BigInt(xudtMintAmount);

      const txHash = await mintXudtTokens(
        signer,
        xudtTypeArgs,
        xudtMintRecipient,
        amount,
      );

      console.log("xUDT mint transaction:", txHash);

      setXudtMintTxHash(txHash);
      recordTransaction("Mint xUDT", txHash);

      await signer.client.waitTransaction(txHash, 1);
      updateTransactionStatus(txHash, "Committed");

      await loadXudtBalance();
      await refreshWalletInfo();

      setXudtMintAmount("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      setXudtMintError(message);
      console.error("Failed to mint xUDT:", error);
    } finally {
      setIsMintingXudt(false);
    }
  };

  // Transaction Query Handler
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

      setIsQueryingTx(true);

      const result = await queryTransaction(signer.client, txHash);

      if (!result) {
        setQueryTxStatus("Not found");
        return;
      }

      setQueryTxStatus(result.status);
      setQueryTxBlock(result.blockNumber);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      setQueryTxError(message);
      console.error("Failed to query transaction:", error);
    } finally {
      setIsQueryingTx(false);
    }
  };

  // Message Sign Handler
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

      const verified = await signer.verifyMessage(message, result);

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

  return (
    <div className="app-dashboard-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
      />

      <div className="app-main-wrapper">
        <Header
          address={address}
          isConnected={Boolean(signerInfo)}
          walletName={wallet?.name}
          onConnect={open}
          onDisconnect={disconnect}
          activeTab={activeTab}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
        />

        <main className="dashboard-content-body">
          {!signerInfo ? (
            <div className="studio-card connect-prompt-card">
              <span style={{ fontSize: "40px" }}>🔌</span>
              <h2>Connect Your Wallet</h2>
              <p className="card-description">
                Connect your JoyID passkey wallet to interact with xUDT tokens, query balances, transfer, and mint on CKB Testnet.
              </p>
              <button
                type="button"
                className="btn-connect-primary"
                onClick={open}
              >
                Connect JoyID Wallet
              </button>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="dashboard-grid">
                  <WalletCard
                    walletName={wallet?.name}
                    address={address}
                    balance={balance}
                    myLockHash={myLockHash}
                    onDisconnect={disconnect}
                  />

                  <TokenCard
                    xudtBalance={xudtBalance}
                    xudtTypeArgs={xudtTypeArgs}
                    setXudtTypeArgs={setXudtTypeArgs}
                    myLockHash={myLockHash}
                  />
                </div>
              )}

              {/* Tokens Tab */}
              {activeTab === "tokens" && (
                <div className="dashboard-grid">
                  <div style={{ gridColumn: "span 2" }}>
                    <TokenCard
                      xudtBalance={xudtBalance}
                      xudtTypeArgs={xudtTypeArgs}
                      setXudtTypeArgs={setXudtTypeArgs}
                      myLockHash={myLockHash}
                    />
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <TokenRegistryCard
                      tokens={registryTokens}
                      activeTypeArgs={xudtTypeArgs}
                      onSelectToken={setXudtTypeArgs}
                      onAddToken={addRegistryToken}
                      onRenameToken={renameRegistryToken}
                      onRemoveToken={removeRegistryToken}
                      hasTokenWithTypeArgs={hasRegistryTokenWithTypeArgs}
                    />
                  </div>

                  <TransferForm
                    recipient={xudtRecipient}
                    setRecipient={setXudtRecipient}
                    amount={xudtTransferAmount}
                    setAmount={setXudtTransferAmount}
                    isTransferring={isTransferringXudt}
                    error={xudtTransferError}
                    txHash={xudtTxHash}
                    xudtBalance={xudtBalance}
                    onSubmit={transferXudt}
                  />

                  <MintForm
                    recipient={xudtMintRecipient}
                    setRecipient={setXudtMintRecipient}
                    amount={xudtMintAmount}
                    setAmount={setXudtMintAmount}
                    isMinting={isMintingXudt}
                    error={xudtMintError}
                    txHash={xudtMintTxHash}
                    myLockHash={myLockHash}
                    xudtTypeArgs={xudtTypeArgs}
                    connectedAddress={address}
                    onSubmit={mintXudt}
                  />
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === "transactions" && (
                <div className="dashboard-grid">
                  <TxQueryCard
                    txHash={queryTxHash}
                    setTxHash={setQueryTxHash}
                    status={queryTxStatus}
                    block={queryTxBlock}
                    error={queryTxError}
                    isQuerying={isQueryingTx}
                    signerExists={Boolean(signer)}
                    onSubmit={handleQueryTransaction}
                  />

                  <TxHistoryCard
                    history={transactionHistory}
                    onCheckTx={(hash) => {
                      setQueryTxHash(hash);
                      setQueryTxError("");
                      setQueryTxStatus("");
                      setQueryTxBlock("");
                      setActiveTab("transactions");
                    }}
                    onClearHistory={clearHistory}
                  />
                </div>
              )}

              {/* Developer Tools Tab */}
              {activeTab === "tools" && (
                <div className="dashboard-grid single-column">
                  <MessageSignCard
                    message={signMessage}
                    setMessage={setSignMessage}
                    signature={signature}
                    signType={signType}
                    verificationResult={verificationResult}
                    error={errorMessage}
                    isSigning={isSigningMessage}
                    signerExists={Boolean(signer)}
                    onSubmit={handleSignMessage}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
