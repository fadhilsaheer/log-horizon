import React from "react";
import { EntryMeta } from "../types/entry";
import { EntryList } from "./entry-list";
import { SidebarHeader } from "./sidebar-header";
import { SidebarFooter } from "./sidebar-footer";
import { cn } from "../lib/utils";

interface Props {
  entries: EntryMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<Props> = (props) => {
  if (props.isOpen === false) return null;

  return (
    <aside className={cn(
      "w-[260px] h-screen bg-mantle flex flex-col shadow-lg",
      "z-10 transition-colors duration-300 flex-shrink-0"
    )}>
      <SidebarHeader onCreate={props.onCreate} />
      
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar")}>
        {props.entries.map((entry) => (
          <EntryList
            key={entry.id}
            entry={entry}
            isActive={props.activeId === entry.id}
            onClick={() => props.onSelect(entry.id)}
          />
        ))}
      </div>

      <SidebarFooter />
    </aside>
  );
};
