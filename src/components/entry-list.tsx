import React from "react";
import { EntryMeta } from "@/types/entry";
import { cn } from "@/lib/utils";

interface Props {
  entry: EntryMeta;
  isActive: boolean;
  onClick: () => void;
}

export const EntryList: React.FC<Props> = (props) => {
  const dateStr = new Date(props.entry.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      onClick={props.onClick}
      className={cn(
        "group p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
        props.isActive
          ? "bg-surface-0 shadow-sm"
          : "hover:bg-surface-0/50 hover:translate-x-1",
      )}
    >
      <h3
        className={cn(
          "font-medium truncate transition-colors duration-300",
          props.isActive ? "text-text" : "text-subtext-1 group-hover:text-text",
        )}
      >
        {props.entry.title}
      </h3>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-subtext-0 font-medium tracking-wide uppercase">
          {dateStr}
        </p>
      </div>
    </div>
  );
};
