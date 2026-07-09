import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { EntryMeta } from "@/types/entry";
import { cn } from "@/lib/utils";

interface Props {
  entry: EntryMeta;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export const EntryList: React.FC<Props> = (props) => {
  const [confirming, setConfirming] = useState(false);
  const dateStr = format(new Date(props.entry.created_at), "MMM d, yyyy");

  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  return (
    <div
      onClick={props.onClick}
      className={cn(
        "group/entry-item relative px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
        props.isActive ? "bg-surface-0" : "hover:bg-surface-0/50",
      )}
    >
      <div className="pr-6">
        <h3
          className={cn(
            "font-medium truncate transition-all duration-300 text-sm",
            props.isActive
              ? "text-text"
              : "text-subtext-1 group-hover/entry-item:text-text",
          )}
        >
          {props.entry.title}
        </h3>
        <p className="text-xs text-subtext-0 font-light">{dateStr}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirming) {
            props.onDelete();
          } else {
            setConfirming(true);
          }
        }}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-all duration-300 rounded-lg",
          confirming
            ? "opacity-100 text-red bg-surface-1"
            : "opacity-0 group-hover/entry-item:opacity-100 text-subtext-0 hover:text-red hover:bg-surface-1"
        )}
        title={confirming ? "Click to confirm delete" : "Delete Entry"}
      >
        {confirming ? (
          <svg
            className="size-3.5 animate-in zoom-in duration-200"
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
            className="size-3.5"
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
  );
};
