import React from "react";
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
  const dateStr = format(new Date(props.entry.created_at), "MMM d, yyyy");

  return (
    <div
      onClick={props.onClick}
      className={cn(
        "group relative px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
        props.isActive ? "bg-surface-0" : "hover:bg-surface-0/50",
      )}
    >
      <div className="pr-6">
        <h3
          className={cn(
            "font-medium truncate transition-colors duration-300 text-sm",
            props.isActive
              ? "text-text"
              : "text-subtext-1 group-hover:text-text",
          )}
        >
          {props.entry.title}
        </h3>
        <p className="text-xs text-subtext-0 font-light">{dateStr}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          props.onDelete();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-subtext-0 hover:text-red transition-all duration-300 rounded-md hover:bg-surface-1"
        title="Delete Entry"
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
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
};
