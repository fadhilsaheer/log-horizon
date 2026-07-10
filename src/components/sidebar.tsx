import React from "react";
import { EntryMeta } from "@/types/entry";
import { EntryList } from "./entry-list";
import { SidebarHeader } from "./sidebar-header";
import { SidebarFooter } from "./sidebar-footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  entries: EntryMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (kind: "freewrite" | "pile") => void;
  onDelete: (id: string) => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<Props> = (props) => {
  return (
    <aside
      className={cn(
        "h-screen bg-mantle flex flex-col",
        "z-10 transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
        props.isOpen !== false ? "w-[260px] opacity-100" : "w-0 opacity-0",
      )}
    >
      <div className="w-[260px] h-full flex flex-col min-w-[260px]">
        <SidebarHeader onCreate={props.onCreate} />

        <ScrollArea className={cn("flex-1 overflow-x-hidden p-2 space-y-1")}>
          {props.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none opacity-80 min-h-[300px]">
              <div className="w-12 h-12 mb-3 rounded-full bg-surface-0/50 flex items-center justify-center text-subtext-0">
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-text">No logs yet</p>
              <p className="text-xs text-subtext-0 mt-1">
                Create your first entry to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 pr-1 pt-2">
              {props.entries.map((entry) => (
                <EntryList
                  key={entry.id}
                  entry={entry}
                  isActive={props.activeId === entry.id}
                  onClick={() => props.onSelect(entry.id)}
                  onDelete={() => props.onDelete(entry.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <SidebarFooter />
      </div>
    </aside>
  );
};
