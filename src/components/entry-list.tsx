import React from "react";
import { EntryMeta } from "../types/entry";

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
      className={`
                group p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out border border-transparent
                ${
                  props.isActive
                    ? "bg-surface-0 border-surface-1 shadow-sm"
                    : "hover:bg-surface-0/50 hover:border-surface-0/50 hover:translate-x-1"
                }
            `}
    >
      <h3
        className={`font-medium truncate transition-colors duration-300 ${props.isActive ? "text-text" : "text-subtext-1 group-hover:text-text"}`}
      >
        {props.entry.title}
      </h3>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-subtext-0 font-medium tracking-wide uppercase">
          {dateStr}
        </p>
      </div>
      {props.entry.preview && (
        <p className="text-sm text-subtext-0 truncate mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {props.entry.preview}
        </p>
      )}
    </div>
  );
};
