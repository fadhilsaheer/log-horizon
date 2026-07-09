import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  dateStr: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSidebar: () => void;
  onDelete: () => void;
  className?: string;
}

export const EditorHeader: React.FC<Props> = (props) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  return (
    <header
      className={cn(
        "px-8 pt-5 pb-1 flex flex-col group relative",
        props.className,
      )}
    >
      <div className="flex items-center justify-between w-full mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={props.onToggleSidebar}
            className="p-1.5 -ml-1 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-md transition-all duration-300 z-20"
            title="Toggle Sidebar"
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-xs text-subtext-0 font-medium tracking-wide uppercase">
            {props.dateStr}
          </span>
        </div>
        <button
          onClick={() => {
            if (confirming) {
              props.onDelete();
            } else {
              setConfirming(true);
            }
          }}
          className={cn(
            "p-1.5 -mr-2 rounded-lg transition-all duration-300",
            confirming
              ? "opacity-100 text-red bg-surface-0"
              : "opacity-0 group-hover:opacity-100 text-subtext-0 hover:text-red hover:bg-surface-0"
          )}
          title={confirming ? "Click to confirm delete" : "Delete Entry"}
        >
          {confirming ? (
            <svg
              className="size-4 animate-in zoom-in duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </div>
      <input
        type="text"
        value={props.title}
        onChange={props.onTitleChange}
        className="text-2xl font-semibold bg-transparent border-none outline-none text-text w-full placeholder:text-surface-1 transition-all duration-300"
        placeholder="Entry Title"
      />
    </header>
  );
};
