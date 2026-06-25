import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  updatedAtStr: string;
  cursorPos: { line: number; col: number };
  wordsCount: number;
  charsCount: number;
  className?: string;
}

export const EditorFooter: React.FC<Props> = ({
  updatedAtStr,
  cursorPos,
  wordsCount,
  charsCount,
  className
}) => {
  return (
    <footer className={cn("flex-none px-8 py-2 border-t border-surface-0/20 flex items-center justify-between text-xs text-subtext-0 bg-base z-10", className)}>
      <div>
        Last updated: {updatedAtStr}
      </div>
      <div className="flex items-center gap-6">
        <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span>{wordsCount} words</span>
        <span>{charsCount} chars</span>
      </div>
    </footer>
  );
};
