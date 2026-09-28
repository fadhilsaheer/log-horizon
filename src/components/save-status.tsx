import { useEffect, useState } from "react";
import { Icon } from "./icon";
export function SaveStatus({
  state,
  onRetry,
}: {
  state: "saving" | "saved" | "error";
  onRetry: () => void;
}) {
  const [spinning, setSpinning] = useState(false);
  useEffect(() => {
    if (state !== "saving") {
      setSpinning(false);
      return;
    }
    const timer = setTimeout(() => setSpinning(true), 350);
    return () => clearTimeout(timer);
  }, [state]);
  const label =
    state === "saving"
      ? "Saving"
      : state === "error"
        ? "Save failed. Retry"
        : "Saved";
  if (state === "error")
    return (
      <button
        className="save-status danger"
        aria-label={label}
        title={label}
        onClick={onRetry}
      >
        <Icon name="alert" size={15} />
      </button>
    );
  // Available to assistive technology without announcing every autosave while typing.
  return (
    <span className="save-status" role="status" aria-live="off" title={label}>
      <span className="sr-only">{label}</span>
      {state === "saving" && spinning ? (
        <span className="save-spinner" aria-hidden="true" />
      ) : (
        <Icon name="check" size={14} />
      )}
    </span>
  );
}
