import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

type Theme = "light" | "dark" | "system";

function RouteComponent() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme !== "system") {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <div className="p-4 flex flex-col items-start gap-4">
      <h1 className="text-2xl font-bold">Hello "/"!</h1>
      
      <div className="flex gap-2 bg-surface-0 p-1 rounded-lg border border-surface-1">
        {(["system", "light", "dark"] as Theme[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-4 py-2 rounded-md capitalize transition-colors ${
              theme === t 
                ? "bg-blue text-base font-medium shadow-sm" 
                : "text-subtext-0 hover:text-text hover:bg-surface-1"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
