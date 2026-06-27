import React, { useEffect, useState, useRef } from "react";
import { Entry } from "@/types/entry";
import { EmptyState } from "./empty-state";
import { EditorHeader } from "./editor-header";
import { EditorFooter } from "./editor-footer";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  }, [props.entry?.id]);

  if (!props.entry) {
    return <EmptyState onToggleSidebar={props.onToggleSidebar} />;
  }

  const handleCursorChange = () => {
    if (textareaRef.current) {
      const textBeforeCursor = textareaRef.current.value.substring(
        0,
        textareaRef.current.selectionStart,
      );
      const lines = textBeforeCursor.split("\n");
      setCursorPos({
        line: lines.length,
        col: lines[lines.length - 1].length + 1,
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

  const dateStr = format(new Date(props.entry.created_at), "MMM d, yyyy, h:mm a");

  const updatedAtStr = format(new Date(props.entry.updated_at), "MMM d, yyyy, h:mm a");

  const wordsCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charsCount = content.length;

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-screen overflow-hidden animate-in fade-in duration-500",
      )}
    >
      <EditorHeader
        title={title}
        dateStr={dateStr}
        onTitleChange={handleTitleChange}
        onToggleSidebar={props.onToggleSidebar}
        onDelete={props.onDelete}
      />

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          className={cn(
            "absolute inset-0 w-full h-full p-8 pt-0 bg-transparent",
            "border-none outline-none text-text text-lg leading-relaxed",
            "resize-none focus:ring-0 custom-scrollbar pb-12",
          )}
          placeholder="Start writing..."
          autoFocus
          spellCheck={false}
        />
      </div>

      <EditorFooter
        updatedAtStr={updatedAtStr}
        cursorPos={cursorPos}
        wordsCount={wordsCount}
        charsCount={charsCount}
      />
    </div>
  );
};
