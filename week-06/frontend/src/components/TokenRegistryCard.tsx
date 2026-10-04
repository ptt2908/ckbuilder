import React, { useState } from "react";
import type { TokenRegistryItem } from "../types/token";
import { isValidTypeArgs, normalizeHexArgs } from "../utils/hex";

interface TokenRegistryCardProps {
  tokens: TokenRegistryItem[];
  activeTypeArgs: string;
  onSelectToken: (typeArgs: string) => void;
  onAddToken: (name: string, typeArgs: string) => TokenRegistryItem;
  onRenameToken: (id: string, newName: string) => void;
  onRemoveToken: (id: string) => void;
  hasTokenWithTypeArgs: (typeArgs: string) => boolean;
}

export const TokenRegistryCard: React.FC<TokenRegistryCardProps> = ({
  tokens,
  activeTypeArgs,
  onSelectToken,
  onAddToken,
  onRenameToken,
  onRemoveToken,
  hasTokenWithTypeArgs,
}) => {
  const [newTokenName, setNewTokenName] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  // Inline delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const normalizedActiveArgs = normalizeHexArgs(activeTypeArgs);
  const isCurrentValid = isValidTypeArgs(normalizedActiveArgs);
  const isCurrentAlreadySaved = hasTokenWithTypeArgs(normalizedActiveArgs);

  const handleSaveCurrentToken = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isCurrentValid) {
      setFeedback({
        type: "error",
        text: "Cannot save: Active xUDT Type Args is not a valid 32-byte hex string.",
      });
      return;
    }

    if (isCurrentAlreadySaved) {
      setFeedback({
        type: "error",
        text: "This token is already saved in your registry.",
      });
      return;
    }

    try {
      onAddToken(newTokenName, activeTypeArgs);
      setNewTokenName("");
      setFeedback({
        type: "success",
        text: "Token saved to registry successfully!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save token.",
      });
    }
  };

  const handleStartRename = (token: TokenRegistryItem) => {
    setEditingId(token.id);
    setEditingName(token.name);
    setRenameError(null);
  };

  const handleSaveRename = (id: string) => {
    setRenameError(null);
    try {
      onRenameToken(id, editingName);
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : "Failed to rename token.",
      );
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName("");
    setRenameError(null);
  };

  const shortenHex = (hex: string) => {
    if (!hex || hex.length <= 18) return hex;
    return `${hex.slice(0, 10)}...${hex.slice(-8)}`;
  };

  return (
    <div className="studio-card registry-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">🏷️</span>
          <div>
            <h2>Saved Token Registry</h2>
            <p className="card-subtitle-sm">
              Save, rename, and quickly switch between xUDT token identities
            </p>
          </div>
        </div>
        <span className="badge-count">{tokens.length} Saved</span>
      </div>

      {/* Save current active token form */}
      <form onSubmit={handleSaveCurrentToken} className="registry-save-section">
        {isCurrentValid && !isCurrentAlreadySaved && (
          <div className="unsaved-token-banner">
            <span>ℹ️ Active token is not saved in your registry. Enter a name below to save it.</span>
          </div>
        )}

        <div className="registry-save-row">
          <div className="save-input-group">
            <label className="save-label">Token Display Name (Optional)</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. My Project xUDT"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn-action-primary save-btn"
            disabled={!isCurrentValid || isCurrentAlreadySaved}
          >
            {isCurrentAlreadySaved ? "Already Saved" : "Save Active Token"}
          </button>
        </div>
        {feedback && (
          <div
            className={`registry-feedback ${
              feedback.type === "error" ? "feedback-error" : "feedback-success"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </form>

      {/* Saved token list */}
      <div className="registry-list-section">
        <h3 className="section-subtitle">Saved Tokens ({tokens.length})</h3>
        {tokens.length === 0 ? (
          <div className="registry-empty-state">
            <p>No tokens saved in your registry yet.</p>
            <p className="hint-text">
              Save your current active Type Args above to easily switch tokens anytime.
            </p>
          </div>
        ) : (
          <div className="registry-items-grid">
            {tokens.map((token) => {
              const isActive =
                normalizeHexArgs(token.typeArgs) === normalizedActiveArgs;
              const isEditing = editingId === token.id;
              const isDeleting = deletingId === token.id;

              return (
                <div
                  key={token.id}
                  className={`registry-item-card ${isActive ? "active-token-card" : ""}`}
                >
                  <div className="registry-item-header">
                    {isEditing ? (
                      <div className="inline-rename-wrapper">
                        <div className="inline-rename-group">
                          <input
                            type="text"
                            className="input-text input-sm"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn-action-text btn-sm"
                            onClick={() => handleSaveRename(token.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn-action-text btn-sm cancel"
                            onClick={handleCancelRename}
                          >
                            Cancel
                          </button>
                        </div>
                        {renameError && (
                          <div className="rename-error-text">{renameError}</div>
                        )}
                      </div>
                    ) : (
                      <div className="token-name-title-row">
                        <span className="token-display-name">{token.name}</span>
                        {isActive && (
                          <span className="status-pill committed active-pill">
                            Active Token
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="registry-item-body">
                    <span className="type-args-code" title={token.typeArgs}>
                      {shortenHex(token.typeArgs)}
                    </span>
                  </div>

                  <div className="registry-item-actions">
                    {isDeleting ? (
                      <div className="delete-confirm-group">
                        <span className="confirm-label">Remove token?</span>
                        <button
                          type="button"
                          className="btn-action-danger btn-sm"
                          onClick={() => {
                            onRemoveToken(token.id);
                            setDeletingId(null);
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="btn-action-text btn-sm cancel"
                          onClick={() => setDeletingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {!isActive ? (
                          <button
                            type="button"
                            className="btn-action-primary btn-sm"
                            onClick={() => onSelectToken(token.typeArgs)}
                          >
                            Use Token
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-action-primary btn-sm disabled-active"
                            disabled
                          >
                            Selected
                          </button>
                        )}

                        {!isEditing && (
                          <button
                            type="button"
                            className="btn-action-secondary btn-sm"
                            onClick={() => handleStartRename(token)}
                          >
                            Rename
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-action-danger btn-sm"
                          onClick={() => setDeletingId(token.id)}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
