import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";

export function useWallet() {
  const { open, disconnect, wallet, signerInfo } = ccc.useCcc();
  const signer = ccc.useSigner();
  const client = signer?.client;

  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<bigint>();
  const [myLockHash, setMyLockHash] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadWalletInfo = async () => {
      if (!signer) {
        setAddress("");
        setBalance(undefined);
        setMyLockHash("");
        return;
      }

      try {
        const addr = await signer.getRecommendedAddress();
        const { script: lock } = await signer.getRecommendedAddressObj();
        const args = lock.hash();
        const bal = await signer.getBalance();

        if (!isCancelled) {
          setAddress(addr);
          setBalance(bal);
          setMyLockHash(args);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load wallet information:", error);
        }
      }
    };

    loadWalletInfo();

    return () => {
      isCancelled = true;
    };
  }, [signer]);

  const refreshWalletInfo = async () => {
    if (!signer) {
      setAddress("");
      setBalance(undefined);
      setMyLockHash("");
      return;
    }

    try {
      const addr = await signer.getRecommendedAddress();
      const { script: lock } = await signer.getRecommendedAddressObj();
      const args = lock.hash();
      const bal = await signer.getBalance();

      setAddress(addr);
      setBalance(bal);
      setMyLockHash(args);
    } catch (error) {
      console.error("Failed to refresh wallet information:", error);
    }
  };

  return {
    open,
    disconnect,
    wallet,
    signerInfo,
    signer,
    client,
    address,
    balance,
    myLockHash,
    refreshWalletInfo,
  };
}
