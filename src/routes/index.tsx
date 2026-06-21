import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section>
      <textarea
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        className="w-screen h-screen bg-mantle p-5 font-serif font-light"
      ></textarea>
    </section>
  );
}
