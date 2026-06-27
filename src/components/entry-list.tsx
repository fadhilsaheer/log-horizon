import React from "react";
import { format } from "date-fns";
import { EntryMeta } from "@/types/entry";
import { cn } from "@/lib/utils";

interface Props {
  entry: EntryMeta;
  isActive: boolean;
  onClick: () => void;
}

export const EntryList: React.FC<Props> = (props) => {
  const dateStr = format(new Date(props.entry.created_at), "MMM d, yyyy");

  return (
    <div
      onClick={props.onClick}
      className={cn(
        "group px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
        props.isActive ? "bg-surface-0" : "hover:bg-surface-0/50",
      )}
    >
      <h3
        className={cn(
          "font-medium truncate transition-colors duration-300 text-sm",
          props.isActive ? "text-text" : "text-subtext-1 group-hover:text-text",
        )}
      >
        {props.entry.title}
      </h3>
      <p className="text-xs text-subtext-0 font-light">{dateStr}</p>
    </div>
  );
};
