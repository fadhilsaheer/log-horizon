import React from "react";
import { EntryMeta } from "../types/entry";
import { EntryList } from "./entry-list";

interface Props {
  entries: EntryMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export const Sidebar: React.FC<Props> = (props) => {
  return (
    <aside className="w-[260px] h-screen bg-mantle flex flex-col shadow-lg z-10 transition-colors duration-300">
      <div className="p-4 backdrop-blur-sm bg-mantle/80 sticky top-0">
        <button
          onClick={props.onCreate}
          className="w-full py-2 px-4 bg-sapphire hover:bg-blue text-base font-medium text-base rounded-md shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center gap-2 group"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          New Entry
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
    </aside>
  );
};
