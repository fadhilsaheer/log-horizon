import React, { useEffect, useState } from "react";
import { Entry } from "../types/entry";

interface Props {
  entry: Entry | null;
  onSave: (title: string, content: string) => void;
  onDelete: () => void;
}

export const Editor: React.FC<Props> = (props) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (props.entry) {
      setTitle(props.entry.title);
      setContent(props.entry.content);
    }
  }, [props.entry?.id]); // Only reset when ID changes

  if (!props.entry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base text-subtext-0 transition-colors duration-500">
        <div className="w-24 h-24 mb-6 opacity-20 transform hover:scale-110 transition-transform duration-700 ease-in-out">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light tracking-wide mb-2">
          Nothing here yet
        </h2>
        <p className="text-subtext-0 mb-6 font-light">
          Select an entry or start writing a new one.
        </p>
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    props.onSave(e.target.value, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    props.onSave(title, e.target.value);
  };

  const dateStr = props.entry
    ? new Date(props.entry.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : "";

  return (
    <div className="flex-1 flex flex-col h-screen bg-base overflow-hidden animate-in fade-in duration-500">
      <header className="px-8 pt-6 pb-4 flex flex-col group">
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-xs text-subtext-0 font-medium tracking-wide uppercase">
            {dateStr}
          </span>
          <button
            onClick={props.onDelete}
            className="opacity-0 group-hover:opacity-100 p-2 -mr-2 text-subtext-0 hover:text-red hover:bg-surface-0 rounded-full transition-all duration-300"
            title="Delete Entry"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
          </button>
        </div>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-2xl font-serif font-medium bg-transparent border-none outline-none text-text w-full placeholder:text-surface-1 transition-all"
          placeholder="Entry Title"
        />
      </header>
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="absolute inset-0 w-full h-full p-8 bg-transparent border-none outline-none text-text text-lg leading-relaxed font-serif resize-none focus:ring-0 custom-scrollbar"
          placeholder="Start writing..."
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};
