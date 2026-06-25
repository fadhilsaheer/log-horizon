import React, { useEffect, useState, useRef } from "react";
import { Entry } from "../types/entry";

interface Props {
  entry: Entry | null;
  onSave: (title: string, content: string) => void;
  onDelete: () => void;
  onToggleSidebar: () => void;
}

export const Editor: React.FC<Props> = (props) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  useEffect(() => {
    if (props.entry) {
      setTitle(props.entry.title);
      setContent(props.entry.content);
    }
  }, [props.entry?.id]); // Only reset when ID changes

  if (!props.entry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base text-subtext-0 transition-colors duration-500 relative">
        <button onClick={props.onToggleSidebar} className="absolute top-6 left-6 p-2 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-md transition-colors z-20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="w-24 h-24 mb-6 opacity-80 transform hover:scale-110 transition-transform duration-700 ease-in-out">
          <img src="/logo.png" alt="Log Horizon" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-2xl font-light tracking-wide mb-2">
          Log Horizon
        </h2>
        <p className="text-subtext-0 mb-6 font-light">
          Select an entry or start writing a new one.
        </p>
      </div>
    );
  }

  const handleCursorChange = () => {
    if (textareaRef.current) {
      const textBeforeCursor = textareaRef.current.value.substring(0, textareaRef.current.selectionStart);
      const lines = textBeforeCursor.split('\n');
      setCursorPos({
        line: lines.length,
        col: lines[lines.length - 1].length + 1
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    props.onSave(e.target.value, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    props.onSave(title, e.target.value);
    handleCursorChange();
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
      <header className="px-8 pt-6 pb-4 flex flex-col group relative">
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center gap-3">
            <button onClick={props.onToggleSidebar} className="p-1 -ml-1 text-subtext-0 hover:text-text hover:bg-surface-0/50 rounded-md transition-colors z-20" title="Toggle Sidebar">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-xs text-subtext-0 font-medium tracking-wide uppercase">
              {dateStr}
            </span>
          </div>
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
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          className="absolute inset-0 w-full h-full p-8 bg-transparent border-none outline-none text-text text-lg leading-relaxed font-serif resize-none focus:ring-0 custom-scrollbar pb-12"
          placeholder="Start writing..."
          autoFocus
          spellCheck={false}
        />
      </div>
      <footer className="flex-none px-8 py-2 border-t border-surface-0/20 flex items-center justify-between text-xs text-subtext-0 bg-base z-10">
        <div>
          Last updated: {props.entry ? new Date(props.entry.updated_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
          }) : ""}
        </div>
        <div className="flex items-center gap-6">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
          <span>{content.length} chars</span>
        </div>
      </footer>
    </div>
  );
};
