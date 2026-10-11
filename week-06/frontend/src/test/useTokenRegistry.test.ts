import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REGISTRY_STORAGE_KEY } from "../config/storageKeys";
import { useTokenRegistry } from "../hooks/useTokenRegistry";
import type { TokenRegistryItem } from "../types/token";

const TYPE_ARGS_A =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const TYPE_ARGS_B =
  "0x2222222222222222222222222222222222222222222222222222222222222222";
const TYPE_ARGS_UPPER =
  "0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD";
const TYPE_ARGS_UPPER_NORMALIZED = TYPE_ARGS_UPPER.toLowerCase();

describe("useTokenRegistry", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("initializes with an empty token list when localStorage is empty", () => {
    const { result } = renderHook(() => useTokenRegistry());

    expect(result.current.tokens).toEqual([]);
    expect(localStorage.getItem(REGISTRY_STORAGE_KEY)).toBe("[]");
  });

  it("restores valid saved tokens and normalizes their Type Args on mount", () => {
    const stored: TokenRegistryItem[] = [
      {
        id: "tok_abcdefab_1700000000000",
        name: "Builder Token",
        typeArgs: `  ${TYPE_ARGS_UPPER}  `,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useTokenRegistry());

    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0]).toEqual({
      id: "tok_abcdefab_1700000000000",
      name: "Builder Token",
      typeArgs: TYPE_ARGS_UPPER_NORMALIZED,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("handles malformed JSON, non-array payloads, and invalid item entries gracefully", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // 1. Malformed JSON string
    localStorage.setItem(REGISTRY_STORAGE_KEY, "{not-valid-json");
    const { result: malformedResult, unmount: unmountMalformed } = renderHook(
      () => useTokenRegistry(),
    );
    expect(malformedResult.current.tokens).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
    unmountMalformed();

    // 2. Non-array JSON value
    localStorage.setItem(
      REGISTRY_STORAGE_KEY,
      JSON.stringify({ id: "tok_1", name: "NotAnArray", typeArgs: TYPE_ARGS_A }),
    );
    const { result: nonArrayResult, unmount: unmountNonArray } = renderHook(
      () => useTokenRegistry(),
    );
    expect(nonArrayResult.current.tokens).toEqual([]);
    unmountNonArray();

    // 3. Array with mixed valid and malformed items
    localStorage.setItem(
      REGISTRY_STORAGE_KEY,
      JSON.stringify([
        null,
        { id: 123, name: "Bad ID", typeArgs: TYPE_ARGS_A },
        { id: "tok_no_name", typeArgs: TYPE_ARGS_A },
        { id: "tok_bad_args", name: "Bad Args", typeArgs: "0x1234" },
        {
          id: "tok_valid",
          name: "Valid Token",
          typeArgs: TYPE_ARGS_A,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    );
    const { result: filteredResult } = renderHook(() => useTokenRegistry());
    expect(filteredResult.current.tokens).toEqual([
      {
        id: "tok_valid",
        name: "Valid Token",
        typeArgs: TYPE_ARGS_A,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("adds tokens in newest-first order, normalizes Type Args, and persists to localStorage", () => {
    const { result } = renderHook(() => useTokenRegistry());

    let addedFirst: TokenRegistryItem | undefined;
    act(() => {
      addedFirst = result.current.addToken(
        "  Alpha Token  ",
        TYPE_ARGS_UPPER.slice(2), // unprefixed uppercase hex
      );
    });

    expect(addedFirst).toBeDefined();
    expect(addedFirst?.name).toBe("Alpha Token");
    expect(addedFirst?.typeArgs).toBe(TYPE_ARGS_UPPER_NORMALIZED);
    expect(addedFirst?.id).toMatch(/^tok_abcdefab_\d+$/);

    act(() => {
      result.current.addToken("Beta Token", TYPE_ARGS_B);
    });

    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.tokens[0].name).toBe("Beta Token");
    expect(result.current.tokens[1].name).toBe("Alpha Token");

    const persisted = JSON.parse(
      localStorage.getItem(REGISTRY_STORAGE_KEY) ?? "[]",
    ) as TokenRegistryItem[];
    expect(persisted).toHaveLength(2);
    expect(persisted[0].typeArgs).toBe(TYPE_ARGS_B);
    expect(persisted[1].typeArgs).toBe(TYPE_ARGS_UPPER_NORMALIZED);
  });

  it("generates a default display name when adding a token with an empty or whitespace name", () => {
    const { result } = renderHook(() => useTokenRegistry());

    act(() => {
      result.current.addToken("   ", TYPE_ARGS_UPPER);
    });

    expect(result.current.tokens[0].name).toBe("xUDT (0xabcdef...efabcd)");
  });

  it("rejects invalid Type Args and duplicate tokens (including case/prefix variations)", () => {
    const { result } = renderHook(() => useTokenRegistry());

    expect(() => result.current.addToken("Invalid", "0x1234")).toThrow(
      "Invalid xUDT Type Args format. Expected 32-byte hex starting with 0x.",
    );

    act(() => {
      result.current.addToken("Original", TYPE_ARGS_UPPER_NORMALIZED);
    });

    expect(() =>
      result.current.addToken("Duplicate Upper", `  ${TYPE_ARGS_UPPER}  `),
    ).toThrow(
      "A token with this xUDT Type Args is already saved in the registry.",
    );
    expect(result.current.tokens).toHaveLength(1);
  });

  it("looks up tokens via hasTokenWithTypeArgs and findTokenByTypeArgs", () => {
    const { result } = renderHook(() => useTokenRegistry());

    act(() => {
      result.current.addToken("Lookup Token", TYPE_ARGS_UPPER_NORMALIZED);
    });

    expect(result.current.hasTokenWithTypeArgs(TYPE_ARGS_UPPER)).toBe(true);
    expect(result.current.hasTokenWithTypeArgs(TYPE_ARGS_B)).toBe(false);
    expect(result.current.hasTokenWithTypeArgs("invalid-hex")).toBe(false);

    expect(result.current.findTokenByTypeArgs(TYPE_ARGS_UPPER)?.name).toBe(
      "Lookup Token",
    );
    expect(result.current.findTokenByTypeArgs(TYPE_ARGS_B)).toBeUndefined();
    expect(result.current.findTokenByTypeArgs("0x1234")).toBeUndefined();
  });

  it("renames an existing token, persists the update, and rejects empty names", () => {
    const { result } = renderHook(() => useTokenRegistry());

    let tokenA!: TokenRegistryItem;
    act(() => {
      tokenA = result.current.addToken("Initial Name", TYPE_ARGS_A);
      result.current.addToken("Other Token", TYPE_ARGS_B);
    });

    expect(() => result.current.renameToken(tokenA.id, "   ")).toThrow(
      "Token name cannot be empty.",
    );

    act(() => {
      result.current.renameToken(tokenA.id, "  Renamed Token  ");
    });

    expect(result.current.findTokenByTypeArgs(TYPE_ARGS_A)?.name).toBe(
      "Renamed Token",
    );
    expect(result.current.findTokenByTypeArgs(TYPE_ARGS_B)?.name).toBe(
      "Other Token",
    );

    const persisted = JSON.parse(
      localStorage.getItem(REGISTRY_STORAGE_KEY) ?? "[]",
    ) as TokenRegistryItem[];
    expect(persisted.find((t) => t.id === tokenA.id)?.name).toBe(
      "Renamed Token",
    );
  });

  it("removes a token by ID and persists the updated registry", () => {
    const { result } = renderHook(() => useTokenRegistry());

    let tokenA!: TokenRegistryItem;
    let tokenB!: TokenRegistryItem;
    act(() => {
      tokenA = result.current.addToken("Token A", TYPE_ARGS_A);
      tokenB = result.current.addToken("Token B", TYPE_ARGS_B);
    });

    act(() => {
      result.current.removeToken(tokenA.id);
    });

    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].id).toBe(tokenB.id);
    expect(result.current.hasTokenWithTypeArgs(TYPE_ARGS_A)).toBe(false);

    const persisted = JSON.parse(
      localStorage.getItem(REGISTRY_STORAGE_KEY) ?? "[]",
    ) as TokenRegistryItem[];
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe(tokenB.id);
  });
});
