import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="flex h-screen w-full bg-base text-text overflow-hidden font-sans antialiased selection:bg-sapphire/30 selection:text-sapphire">
      <Outlet />
    </div>
  ),
});
