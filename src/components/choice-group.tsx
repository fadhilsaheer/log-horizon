import { useId, useRef } from "react";
export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="setting-row">
      <span id={id}>{label}</span>
      <div className="choice-group" role="radiogroup" aria-labelledby={id}>
        {options.map((option, index) => (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            tabIndex={value === option.value ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              const direction =
                event.key === "ArrowRight" || event.key === "ArrowDown"
                  ? 1
                  : event.key === "ArrowLeft" || event.key === "ArrowUp"
                    ? -1
                    : 0;
              if (direction) {
                event.preventDefault();
                const next =
                  (index + direction + options.length) % options.length;
                onChange(options[next].value);
                refs.current[next]?.focus();
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
