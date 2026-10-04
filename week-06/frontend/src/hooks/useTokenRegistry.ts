import { useEffect, useState } from "react";
import { REGISTRY_STORAGE_KEY } from "../config/storageKeys";
import type { TokenRegistryItem } from "../types/token";
import { isValidTypeArgs, normalizeHexArgs } from "../utils/hex";

export function useTokenRegistry() {
  const [tokens, setTokens] = useState<TokenRegistryItem[]>(() => {
    try {
      const saved = localStorage.getItem(REGISTRY_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as TokenRegistryItem[];
      if (!Array.isArray(parsed)) return [];

      // Safely filter and normalize valid registry items
      return parsed.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          isValidTypeArgs(item.typeArgs),
      ).map((item) => ({
        ...item,
        typeArgs: normalizeHexArgs(item.typeArgs),
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

  const hasTokenWithTypeArgs = (typeArgs: string): boolean => {
    const normalized = normalizeHexArgs(typeArgs);
    if (!isValidTypeArgs(normalized)) return false;
    return tokens.some(
      (t) => normalizeHexArgs(t.typeArgs) === normalized,
    );
  };

  const findTokenByTypeArgs = (
    typeArgs: string,
  ): TokenRegistryItem | undefined => {
    const normalized = normalizeHexArgs(typeArgs);
    if (!isValidTypeArgs(normalized)) return undefined;
    return tokens.find(
      (t) => normalizeHexArgs(t.typeArgs) === normalized,
    );
  };

  const addToken = (name: string, typeArgs: string): TokenRegistryItem => {
    const normalized = normalizeHexArgs(typeArgs);
    if (!isValidTypeArgs(normalized)) {
      throw new Error(
        "Invalid xUDT Type Args format. Expected 32-byte hex starting with 0x.",
      );
    }

    if (hasTokenWithTypeArgs(normalized)) {
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
