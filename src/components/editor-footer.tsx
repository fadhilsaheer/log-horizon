import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  updatedAtStr: string;
  cursorPos: { line: number; col: number };
  wordsCount: number;
  charsCount: number;
  isSaving?: boolean;
  className?: string;
}

export const EditorFooter: React.FC<Props> = (props) => {
  return (
    <footer
      className={cn(
        "flex-none px-8 pb-5 pt-1 flex items-center justify-between text-xs text-subtext-0 bg-base z-10 transition-all duration-300",
        props.className,
      )}
    >
      <div className="flex items-center gap-1.5 min-w-[150px]">
        {props.isSaving ? (
          <svg className="animate-spin h-3.5 w-3.5 text-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span>Last updated: {props.updatedAtStr}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="tabular-nums">
          Ln {props.cursorPos.line}, Col {props.cursorPos.col}
        </span>
        <span className="tabular-nums">{props.wordsCount} words</span>
        <span className="tabular-nums">{props.charsCount} chars</span>
      </div>
    </footer>
  );
};
