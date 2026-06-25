import React from "react";
import { EntryMeta } from "../types/entry";
import { EntryList } from "./entry-list";
import { useTheme } from "../hooks/useTheme";

interface Props {
  entries: EntryMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<Props> = (props) => {
  const { theme, setTheme } = useTheme();

  if (props.isOpen === false) return null;

  return (
    <aside className="w-[260px] h-screen bg-mantle flex flex-col shadow-lg z-10 transition-colors duration-300 flex-shrink-0">
      <div className="p-4 backdrop-blur-sm bg-mantle/80 sticky top-0 flex items-center justify-between z-20 border-b border-surface-0/20">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Log Horizon" className="w-6 h-6 object-contain" />
          <span className="font-semibold text-text">Log Horizon</span>
        </div>
        <button
          onClick={props.onCreate}
          className="p-1.5 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-md transition-colors"
          title="New Entry"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
        {props.entries.map((entry) => (
          <EntryList
            key={entry.id}
            entry={entry}
            isActive={props.activeId === entry.id}
            onClick={() => props.onSelect(entry.id)}
          />
        ))}
      </div>
      <div className="p-4 border-t border-surface-0/20 mt-auto">
        <button 
           onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
           className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-surface-0/50 text-subtext-0 hover:text-text transition-colors text-sm"
        >
          {theme === 'dark' ? (
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
          <span>Toggle Theme</span>
        </button>
      </div>
    </aside>
  );
};
