import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PileItem {
  id: string;
  text: string;
  timestamp?: number;
}

interface Props {
  content: string;
  onChange: (content: string) => void;
  entryId: string;
}

export const PileEditor: React.FC<Props> = ({ content, onChange, entryId }) => {
  const [items, setItems] = useState<PileItem[]>([]);
  const textareasRef = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  useEffect(() => {
    try {
      const parsed = JSON.parse(content || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        setItems(parsed.map(item => ({ ...item, timestamp: item.timestamp || Date.now() })));
      } else {
        setItems([{ id: crypto.randomUUID(), text: "", timestamp: Date.now() }]);
      }
    } catch {
      setItems([{ id: crypto.randomUUID(), text: content, timestamp: Date.now() }]);
    }
    // Only re-initialize when entry changes to avoid losing focus
  }, [entryId]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setDeleteConfirmId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Adjust all textareas on mount or items change
  useEffect(() => {
    Object.values(textareasRef.current).forEach((el) => {
      if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    });
  }, [items.length]); // Only bulk adjust when items are added/removed

  const updateItem = (id: string, text: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, text } : item
    );
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const addItem = (index: number) => {
    const newId = crypto.randomUUID();
    const newItems = [...items];
    newItems.splice(index + 1, 0, { id: newId, text: "", timestamp: Date.now() });
    setItems(newItems);
    onChange(JSON.stringify(newItems));
    
    // Focus the new textarea after render
    setTimeout(() => {
      textareasRef.current[newId]?.focus();
    }, 0);
  };

  const deleteItem = (index: number) => {
    const newItems = [...items];
    if (newItems.length === 1) {
      newItems[0].text = "";
    } else {
      newItems.splice(index, 1);
    }
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addItem(index);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full py-4 pr-4">

      {items.map((item, index) => {
        const timeAgo = item.timestamp 
          ? formatDistanceToNow(item.timestamp, { addSuffix: true }) 
          : "just now";

        return (
        <div key={item.id} className="relative flex gap-4">
          {/* Thread visuals */}
          <div className="flex flex-col items-center mt-1.5 relative w-4 shrink-0">
            <div className="w-4 h-4 rounded-full bg-surface-2 z-10 shrink-0" />
            {index < items.length - 1 && (
              <div className="w-0.5 bg-surface-1 absolute top-[20px] bottom-[-26px] left-1/2 -translate-x-1/2" />
            )}
          </div>

          <div className="flex-1 flex flex-col gap-2 relative">
            <textarea
              ref={(el) => { textareasRef.current[item.id] = el; }}
              value={item.text}
              onChange={(e) => {
                updateItem(item.id, e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              placeholder={index === 0 ? "What are you thinking?" : "Start writing..."}
              className={cn(
                "w-full bg-transparent border-none outline-none text-text text-lg leading-relaxed",
                "resize-none focus:ring-0 overflow-hidden min-h-[40px] pr-36"
              )}
              spellCheck={false}
              rows={1}
            />

            {item.text.length > 0 && (
              <div className="absolute right-0 top-1.5 flex items-center justify-end gap-3 w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(deleteConfirmId === item.id ? null : item.id);
                  }}
                  className="text-xs text-subtext-0 hover:text-text transition-colors whitespace-nowrap"
                >
                  {timeAgo}
                </button>
              </div>
            )}

            {deleteConfirmId === item.id && (
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(index);
                    setDeleteConfirmId(null);
                  }}
                  className="text-sm font-medium text-red hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
};
