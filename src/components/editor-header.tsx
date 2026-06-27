import React from "react";
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
  return (
    <header
      className={cn(
        "px-8 pt-3.5 pb-4 flex flex-col group relative",
        props.className,
      )}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={props.onToggleSidebar}
            className="p-1.5 -ml-1 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-md transition-colors z-20"
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
          onClick={props.onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 -mr-2 text-subtext-0 hover:text-red hover:bg-surface-0 rounded-lg transition-all duration-300"
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
      <input
        type="text"
        value={props.title}
        onChange={props.onTitleChange}
        className="text-2xl font-semibold bg-transparent border-none outline-none text-text w-full placeholder:text-surface-1 transition-all"
        placeholder="Entry Title"
      />
    </header>
  );
};
