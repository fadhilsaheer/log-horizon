import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  onToggleSidebar: () => void;
  className?: string;
}

export const EmptyState: React.FC<Props> = ({ onToggleSidebar, className }) => {
  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center bg-base text-subtext-0 transition-colors duration-500 relative", className)}>
      <button 
        onClick={onToggleSidebar} 
        className="absolute top-6 left-6 p-2 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-md transition-colors z-20"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="w-24 h-24 mb-6 opacity-80 transform hover:scale-110 transition-transform duration-700 ease-in-out">
        <img src="/logo.png" alt="Log Horizon" className="w-full h-full object-contain" />
      </div>
      <h2 className="text-2xl font-light tracking-wide mb-2">
        Log Horizon
      </h2>
      <p className="text-subtext-0 mb-6 font-light">
        Select an entry or start writing a new one.
      </p>
    </div>
  );
};
