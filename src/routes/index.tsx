import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-4 flex flex-col items-start gap-4">
      <h1 className="text-2xl font-bold">Hello "/"!</h1>
    </div>
  );
}
