import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const ConfirmModal: React.FC<Props> = (props) => {
  const [renderState, setRenderState] = useState<
    "closed" | "opening" | "open" | "closing"
  >("closed");

  useEffect(() => {
    let timeoutId: number;
    let raf1: number;
    let raf2: number;

    if (props.isOpen) {
      setRenderState("opening");
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setRenderState("open"));
      });
    } else {
      setRenderState((prev) => {
        if (prev === "open" || prev === "opening") {
          timeoutId = window.setTimeout(() => setRenderState("closed"), 150);
          return "closing";
        }
        return prev;
      });
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timeoutId);
    };
  }, [props.isOpen]);

  if (renderState === "closed") return null;

  const isModalOpen = renderState === "open";
  const isModalClosing = renderState === "closing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-crust/70 backdrop-blur-sm transition-opacity duration-200",
          isModalOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={props.onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "t-modal relative bg-base border border-surface-0 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col",
          isModalOpen && "is-open",
          isModalClosing && "is-closing",
        )}
        role="dialog"
      >
        <h2 className="text-lg font-bold text-text mb-2">{props.title}</h2>
        <p className="text-subtext-0 text-sm mb-6">{props.description}</p>

        <div className="flex justify-end gap-3 mt-auto">
          <button
            onClick={props.onClose}
            className="px-4 py-2 text-sm font-medium text-subtext-0 hover:text-text hover:bg-surface-0 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={props.onConfirm}
            className="px-4 py-2 text-sm font-medium text-base bg-red hover:bg-red/90 rounded-lg transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
