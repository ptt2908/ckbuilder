import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useRef, useState } from "react";
import { TYPE_ARGS_STORAGE_KEY } from "../config/storageKeys";
import { queryXudtBalance } from "../services/xudtService";
import { isValidTypeArgs } from "../utils/hex";

function getSavedValidTypeArgs(): string | null {
  try {
    const saved = localStorage.getItem(TYPE_ARGS_STORAGE_KEY);
    if (saved && isValidTypeArgs(saved)) {
      return saved.trim();
    }
  } catch (error) {
    console.warn("Could not restore saved xUDT Type Args:", error);
  }
  return null;
}

export function useTokenManager(
  signer: ccc.Signer | undefined,
  myLockHash?: string,
) {
  const [xudtTypeArgs, setXudtTypeArgs] = useState<string>(
    () => getSavedValidTypeArgs() ?? "",
  );

  const [xudtBalance, setXudtBalance] = useState<bigint>();

  // Default xUDT Type Args to connected lock hash if no valid selection exists
  const [prevLockHash, setPrevLockHash] = useState(myLockHash);
  if (prevLockHash !== myLockHash) {
    setPrevLockHash(myLockHash);
    if (myLockHash) {
      setXudtTypeArgs((prev) => {
        if (isValidTypeArgs(prev)) {
          return prev;
        }
        return getSavedValidTypeArgs() ?? myLockHash;
      });
    }
  }

  // Reset balance state immediately when token selection or signer changes
  const [prevBalanceDeps, setPrevBalanceDeps] = useState({
    signer,
    xudtTypeArgs,
  });
  if (
    prevBalanceDeps.signer !== signer ||
    prevBalanceDeps.xudtTypeArgs !== xudtTypeArgs
  ) {
    setPrevBalanceDeps({ signer, xudtTypeArgs });
    setXudtBalance(undefined);
  }

  // Refs to track latest signer and xudtTypeArgs for async guards
  const currentSignerRef = useRef(signer);
  const currentTypeArgsRef = useRef(xudtTypeArgs);
  useEffect(() => {
    currentSignerRef.current = signer;
    currentTypeArgsRef.current = xudtTypeArgs;
  }, [signer, xudtTypeArgs]);

  // Persist xUDT Type Args to localStorage
  useEffect(() => {
    try {
      if (isValidTypeArgs(xudtTypeArgs)) {
        localStorage.setItem(TYPE_ARGS_STORAGE_KEY, xudtTypeArgs.trim());
      }
    } catch (error) {
      console.warn("Could not persist xUDT Type Args:", error);
    }
  }, [xudtTypeArgs]);

  // Balance query effect with race-condition guard
  useEffect(() => {
    let isCancelled = false;

    const fetchBalance = async () => {
      const targetArgs = xudtTypeArgs.trim();
      if (!signer || !targetArgs || !isValidTypeArgs(targetArgs)) {
        return;
      }

      try {
        const { script: lock } = await signer.getRecommendedAddressObj();
        const total = await queryXudtBalance(
          signer.client,
          lock,
          targetArgs,
        );

        if (!isCancelled) {
          setXudtBalance(total);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to query xUDT balance:", error);
          setXudtBalance(undefined);
        }
      }
    };

    fetchBalance();

    return () => {
      isCancelled = true;
    };
  }, [signer, xudtTypeArgs]);

  // Explicit balance refresh function
  const loadXudtBalance = async () => {
    const targetArgs = currentTypeArgsRef.current.trim();
    if (!signer || !targetArgs || !isValidTypeArgs(targetArgs)) {
      if (currentSignerRef.current === signer) {
        setXudtBalance(undefined);
      }
      return;
    }

    try {
      const { script: lock } = await signer.getRecommendedAddressObj();
      const total = await queryXudtBalance(
        signer.client,
        lock,
        targetArgs,
      );
      if (
        currentSignerRef.current === signer &&
        currentTypeArgsRef.current.trim() === targetArgs
      ) {
        setXudtBalance(total);
      }
    } catch (error) {
      console.error("Failed to query xUDT balance:", error);
    }
  };

  return {
    xudtTypeArgs,
    setXudtTypeArgs,
    xudtBalance,
    loadXudtBalance,
  };
}
