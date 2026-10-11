import { useEffect, useState } from "react";
import { CKB_DEFAULT_NETWORK_ID } from "../config/network";
import { REGISTRY_STORAGE_KEY } from "../config/storageKeys";
import type { TokenRegistryItem } from "../types/token";
import { isValidTypeArgs, normalizeHexArgs } from "../utils/hex";

export function useTokenRegistry(
  activeNetworkId: string = CKB_DEFAULT_NETWORK_ID,
) {
  const normalizedActiveNetworkId =
    activeNetworkId.trim() || CKB_DEFAULT_NETWORK_ID;

  const [tokens, setTokens] = useState<TokenRegistryItem[]>(() => {
    try {
      const saved = localStorage.getItem(REGISTRY_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as Partial<TokenRegistryItem>[];
      if (!Array.isArray(parsed)) return [];

      // Safely filter, normalize, and migrate valid registry items
      return parsed
        .filter(
          (item): item is TokenRegistryItem =>
            Boolean(item) &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.typeArgs === "string" &&
            isValidTypeArgs(item.typeArgs),
        )
        .map((item) => ({
          ...item,
          typeArgs: normalizeHexArgs(item.typeArgs),
          networkId:
            typeof item.networkId === "string" && item.networkId.trim()
              ? item.networkId.trim()
              : CKB_DEFAULT_NETWORK_ID,
        }));
    } catch (error) {
      console.warn("Could not restore token registry from storage:", error);
      return [];
    }
  });

  // Persist registry changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.warn("Could not persist token registry:", error);
    }
  }, [tokens]);

  const resolveNetworkId = (networkId?: string): string => {
    return typeof networkId === "string" && networkId.trim()
      ? networkId.trim()
      : normalizedActiveNetworkId;
  };

  const hasTokenWithTypeArgs = (
    typeArgs: string,
    networkId?: string,
  ): boolean => {
    const normalized = normalizeHexArgs(typeArgs);
    if (!isValidTypeArgs(normalized)) return false;
    const targetNetworkId = resolveNetworkId(networkId);
    return tokens.some(
      (t) =>
        normalizeHexArgs(t.typeArgs) === normalized &&
        t.networkId === targetNetworkId,
    );
  };

  const findTokenByTypeArgs = (
    typeArgs: string,
    networkId?: string,
  ): TokenRegistryItem | undefined => {
    const normalized = normalizeHexArgs(typeArgs);
    if (!isValidTypeArgs(normalized)) return undefined;
    const targetNetworkId = resolveNetworkId(networkId);
    return tokens.find(
      (t) =>
        normalizeHexArgs(t.typeArgs) === normalized &&
        t.networkId === targetNetworkId,
    );
  };

  const addToken = (
    name: string,
    typeArgs: string,
    networkId?: string,
  ): TokenRegistryItem => {
    const normalized = normalizeHexArgs(typeArgs);
    if (!isValidTypeArgs(normalized)) {
      throw new Error(
        "Invalid xUDT Type Args format. Expected 32-byte hex starting with 0x.",
      );
    }

    const targetNetworkId = resolveNetworkId(networkId);

    if (hasTokenWithTypeArgs(normalized, targetNetworkId)) {
      throw new Error(
        "A token with this xUDT Type Args is already saved in the registry.",
      );
    }

    const displayName =
      name.trim() ||
      `xUDT (${normalized.slice(0, 8)}...${normalized.slice(-6)})`;

    const newItem: TokenRegistryItem = {
      id: `tok_${normalized.slice(2, 10)}_${Date.now()}`,
      name: displayName,
      typeArgs: normalized,
      networkId: targetNetworkId,
      createdAt: new Date().toISOString(),
    };

    setTokens((current) => [newItem, ...current]);
    return newItem;
  };

  const renameToken = (id: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error("Token name cannot be empty.");
    }

    setTokens((current) =>
      current.map((t) => (t.id === id ? { ...t, name: trimmedName } : t)),
    );
  };

  const removeToken = (id: string) => {
    setTokens((current) => current.filter((t) => t.id !== id));
  };

  return {
    tokens,
    addToken,
    renameToken,
    removeToken,
    findTokenByTypeArgs,
    hasTokenWithTypeArgs,
  };
}
