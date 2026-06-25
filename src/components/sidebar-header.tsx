import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  onCreate: () => void;
  className?: string;
}

export const SidebarHeader: React.FC<Props> = ({ onCreate, className }) => {
  return (
    <div className={cn("p-4 backdrop-blur-sm bg-mantle/80 sticky top-0 flex items-center justify-between z-20 border-b border-surface-0/20", className)}>
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Log Horizon" className="w-6 h-6 object-contain" />
        <span className="font-semibold text-text">Log Horizon</span>
      </div>
      <button
        onClick={onCreate}
        className="p-1.5 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-md transition-colors"
        title="New Entry"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </button>
    </div>
  );
};
