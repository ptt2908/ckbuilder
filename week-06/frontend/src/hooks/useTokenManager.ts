import { ccc } from "@ckb-ccc/connector-react";
import { useEffect, useRef, useState } from "react";
import { TYPE_ARGS_STORAGE_KEY } from "../config/storageKeys";
import { queryXudtBalance } from "../services/xudtService";
import { isValidTypeArgs } from "../utils/hex";

export function useTokenManager(
  signer: ccc.Signer | undefined,
  myLockHash?: string,
) {
  const [xudtTypeArgs, setXudtTypeArgs] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(TYPE_ARGS_STORAGE_KEY);
      if (saved && isValidTypeArgs(saved)) {
        return saved.trim();
      }
    } catch (error) {
      console.warn("Could not restore saved xUDT Type Args:", error);
    }
    return "";
  });

  const [xudtBalance, setXudtBalance] = useState<bigint>();

  // Ref to track latest xudtTypeArgs for async guards
  const currentTypeArgsRef = useRef(xudtTypeArgs);
  useEffect(() => {
    currentTypeArgsRef.current = xudtTypeArgs;
  }, [xudtTypeArgs]);

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

  // Default xUDT Type Args to connected lock hash if no valid selection exists
  useEffect(() => {
    if (myLockHash) {
      setXudtTypeArgs((prev) => {
        if (isValidTypeArgs(prev)) {
          return prev;
        }
        try {
          const saved = localStorage.getItem(TYPE_ARGS_STORAGE_KEY);
          if (saved && isValidTypeArgs(saved)) {
            return saved.trim();
          }
        } catch {}
        return myLockHash;
      });
    }
  }, [myLockHash]);

  // Balance query effect with race-condition guard
  useEffect(() => {
    let isCancelled = false;

    // Reset balance state immediately when token selection or signer changes
    setXudtBalance(undefined);

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
      setXudtBalance(undefined);
      return;
    }

    try {
      const { script: lock } = await signer.getRecommendedAddressObj();
      const total = await queryXudtBalance(
        signer.client,
        lock,
        targetArgs,
      );
      if (currentTypeArgsRef.current.trim() === targetArgs) {
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
