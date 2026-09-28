import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Modal } from "./modal";

export function PasswordDialog({
  setup,
  onClose,
  onSubmit,
}: {
  setup: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (setup && password !== confirmation) {
      setError("The passwords don’t match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(password);
      setPassword("");
      setConfirmation("");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={setup ? "Set password" : "Unlock entries"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="dialog-description">
        {setup
          ? "One password protects any entry or pile you mark private. Use at least 10 characters. There is no password reset, so keep it somewhere safe."
          : "Enter your diary password to unlock private entries for this session."}
      </p>
      <form onSubmit={submit} className="password-form">
        <label>
          Diary password
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={setup ? "new-password" : "current-password"}
            required
            minLength={setup ? 10 : 1}
          />
        </label>
        {setup && (
          <label>
            Repeat password
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="new-password"
              required
              minLength={10}
            />
          </label>
        )}
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy}>
          {busy ? "Unlocking…" : setup ? "Set password" : "Unlock"}
        </button>
      </form>
    </Modal>
  );
}
export function PasswordChange({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open)
    return (
      <button className="text-button" onClick={() => setOpen(true)}>
        Change password
      </button>
    );
  return (
    <form
      className="password-form compact-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== repeat) {
          setError("The new passwords don’t match.");
          return;
        }
        setBusy(true);
        void api("change_password", { current, password })
          .then(() => {
            setCurrent("");
            setPassword("");
            setRepeat("");
            setOpen(false);
            onDone();
          })
          .catch((e) => setError(String(e)))
          .finally(() => setBusy(false));
      }}
    >
      <label>
        Current password
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label>
        New password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={10}
          required
        />
      </label>
      <label>
        Repeat new password
        <input
          type="password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          autoComplete="new-password"
          minLength={10}
          required
        />
      </label>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <button className="secondary-button" disabled={busy}>
        {busy ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
