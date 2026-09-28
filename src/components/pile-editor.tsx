import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import { readPile, type Pile } from "@/types/entry";

export function PileEditor({
  content,
  onChange,
  readOnly = false,
  privateEntry = false,
}: {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  privateEntry?: boolean;
}) {
  let pile: Pile;
  try {
    pile = readPile(content);
  } catch (error) {
    return (
      <p role="alert" className="inline-error">
        {String(error)}
      </p>
    );
  }
  return (
    <PileContent
      pile={pile}
      onChange={(p) => onChange(JSON.stringify(p))}
      readOnly={readOnly}
      privateEntry={privateEntry}
    />
  );
}
function PileContent({
  pile,
  onChange,
  readOnly,
  privateEntry,
}: {
  pile: Pile;
  onChange: (p: Pile) => void;
  readOnly: boolean;
  privateEntry: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);
  const stream = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState<string | null>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (composer.current) {
      composer.current.style.height = "auto";
      composer.current.style.height = `${Math.min(96, composer.current.scrollHeight)}px`;
    }
  }, [pile.draft]);
  useLayoutEffect(() => {
    if (stream.current) stream.current.scrollTop = stream.current.scrollHeight;
  }, [pile.items.length]);
  const send = () => {
    if (!pile.draft.trim()) return;
    const id = crypto.randomUUID();
    setAdded(id);
    onChange({
      items: [
        ...pile.items,
        {
          id,
          text: pile.draft.trim(),
          timestamp: Date.now(),
        },
      ],
      draft: "",
    });
    composer.current?.focus();
  };
  return (
    <div className="pile-layout">
      <div className="thought-stream" ref={stream}>
        <div className="thought-stack">
          {pile.items.map((item) => (
            <article
              className={`thought ${added === item.id ? "thought-added" : ""}`}
              key={item.id}
            >
              {editing === item.id ? (
                <textarea
                  spellCheck={!privateEntry}
                  autoCorrect={privateEntry ? "off" : "on"}
                  className="thought-edit"
                  aria-label="Edit thought"
                  autoFocus
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  value={item.text}
                  onChange={(e) =>
                    onChange({
                      ...pile,
                      items: pile.items.map((i) =>
                        i.id === item.id ? { ...i, text: e.target.value } : i,
                      ),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditing(null);
                  }}
                />
              ) : (
                <p className="thought-text">{item.text}</p>
              )}
              <div className="thought-meta">
                <time>
                  {item.timestamp
                    ? new Date(item.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Earlier thought"}
                </time>
                {!readOnly && (
                  <div className="thought-actions">
                    <button
                      className="icon-button"
                      aria-label={
                        editing === item.id
                          ? "Finish editing thought"
                          : "Edit thought"
                      }
                      title={editing === item.id ? "Done" : "Edit thought"}
                      onClick={() =>
                        setEditing(editing === item.id ? null : item.id)
                      }
                    >
                      <Icon
                        name={editing === item.id ? "check" : "write"}
                        size={14}
                      />
                    </button>
                    <button
                      className={`icon-button ${confirmDelete === item.id ? "confirm-delete danger" : ""}`}
                      aria-label={
                        confirmDelete === item.id
                          ? "Confirm delete thought"
                          : "Delete thought"
                      }
                      title={
                        confirmDelete === item.id
                          ? "Click again to delete"
                          : "Delete thought"
                      }
                      onBlur={() => setConfirmDelete(null)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setConfirmDelete(null);
                        }
                      }}
                      onClick={() => {
                        if (confirmDelete !== item.id) {
                          setConfirmDelete(item.id);
                          return;
                        }
                        onChange({
                          ...pile,
                          items: pile.items.filter((i) => i.id !== item.id),
                        });
                        setConfirmDelete(null);
                        composer.current?.focus();
                      }}
                    >
                      <Icon
                        name={confirmDelete === item.id ? "check" : "trash"}
                        size={14}
                      />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
      {!readOnly ? (
        <div className="thought-input-wrap">
          <div className="thought-input">
            <textarea
              autoFocus
              spellCheck={!privateEntry}
              autoCorrect={privateEntry ? "off" : "on"}
              ref={composer}
              rows={1}
              aria-label="New thought"
              placeholder="Add a thought…"
              value={pile.draft}
              onChange={(e) => onChange({ ...pile, draft: e.target.value })}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="add-thought-button"
              aria-label="Add thought"
              disabled={!pile.draft.trim()}
              onClick={send}
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        pile.draft && <p className="thought-text">Draft: {pile.draft}</p>
      )}
    </div>
  );
}
