import React from "react";
import { EntryMeta } from "@/types/entry";
import { EntryList } from "./entry-list";
import { SidebarHeader } from "./sidebar-header";
import { SidebarFooter } from "./sidebar-footer";
import { cn } from "@/lib/utils";

interface Props {
  entries: EntryMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<Props> = (props) => {
  return (
    <aside
      className={cn(
        "h-screen bg-mantle flex flex-col shadow-lg",
        "z-10 transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
        props.isOpen !== false ? "w-[260px] opacity-100" : "w-0 opacity-0",
      )}
    >
      <div className="w-[260px] h-full flex flex-col min-w-[260px]">
        <SidebarHeader onCreate={props.onCreate} />

        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar",
          )}
        >
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
      </div>
    </aside>
  );
};
