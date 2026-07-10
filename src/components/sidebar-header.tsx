import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onCreate: (kind: "freewrite" | "pile") => void;
  className?: string;
}

export const SidebarHeader: React.FC<Props> = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={cn(
        "px-5 pt-5 backdrop-blur-sm bg-mantle/80 sticky top-0 flex items-center justify-between z-20 transition-all duration-300",
        props.className,
      )}
    >
      <div className="flex items-center gap-2">
        <img
          src="/logo.png"
          alt="Log Horizon"
          className="w-6 h-6 object-contain"
        />
        <span className="font-black text-text">Log Horizon</span>
      </div>

      <div className="relative flex items-center" ref={menuRef}>
        <button
          onClick={() => props.onCreate("freewrite")}
          className="p-1.5 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-lg transition-all duration-300"
          title="New Freewrite"
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            ></path>
          </svg>
        </button>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-lg transition-all duration-300"
          title="More options"
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
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>

        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-1 w-40 bg-surface-0 border border-surface-1 rounded-md shadow-lg overflow-hidden z-50">
            <button
              className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface-1 transition-colors"
              onClick={() => {
                props.onCreate("freewrite");
                setIsMenuOpen(false);
              }}
            >
              Create Freewrite
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface-1 transition-colors"
              onClick={() => {
                props.onCreate("pile");
                setIsMenuOpen(false);
              }}
            >
              Create Pile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
