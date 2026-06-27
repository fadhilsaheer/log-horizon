import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  updatedAtStr: string;
  cursorPos: { line: number; col: number };
  wordsCount: number;
  charsCount: number;
  className?: string;
}

export const EditorFooter: React.FC<Props> = (props) => {
  return (
    <footer
      className={cn(
        "flex-none px-8 py-5 flex items-center justify-between text-xs text-subtext-0 bg-base z-10",
        props.className,
      )}
    >
      <div>Last updated: {props.updatedAtStr}</div>
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
