import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const [isBottom, setIsBottom] = React.useState(true);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = React.useCallback(() => {
    if (viewportRef.current) {
      const target = viewportRef.current;
      setScrollTop(target.scrollTop);
      // 2px threshold for rounding errors
      setIsBottom(target.scrollHeight - target.scrollTop <= target.clientHeight + 2);
    }
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(viewport);
    if (viewport.firstElementChild) {
      observer.observe(viewport.firstElementChild);
    }
    
    checkScroll();
    return () => observer.disconnect();
  }, [checkScroll]);

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden group", className)}
      {...props}
    >
      {/* Top Blur Fade Overlay */}
      <div 
        className={cn(
          "absolute top-0 inset-x-0 h-10 z-10 pointer-events-none select-none backdrop-blur-[4px] [mask-image:linear-gradient(to_bottom,black_20%,transparent)] transition-opacity duration-300",
          scrollTop > 0 ? "opacity-100" : "opacity-0"
        )} 
      />

      <ScrollAreaPrimitive.Viewport 
        ref={viewportRef}
        className="h-full w-full rounded-[inherit] [&>div]:!block transition-all duration-300"
        onScroll={checkScroll}
        style={{
          maskImage: `linear-gradient(to bottom, ${scrollTop > 0 ? 'transparent' : 'black'}, black 32px, black calc(100% - 32px), ${isBottom ? 'black' : 'transparent'})`,
          WebkitMaskImage: `linear-gradient(to bottom, ${scrollTop > 0 ? 'transparent' : 'black'}, black 32px, black calc(100% - 32px), ${isBottom ? 'black' : 'transparent'})`
        }}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      {/* Bottom Blur Fade Overlay */}
      <div 
        className={cn(
          "absolute bottom-0 inset-x-0 h-10 z-10 pointer-events-none select-none backdrop-blur-[4px] [mask-image:linear-gradient(to_top,black_20%,transparent)] transition-opacity duration-300",
          isBottom ? "opacity-0" : "opacity-100"
        )} 
      />

      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[2px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[2px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-surface-1 hover:bg-surface-2 transition-colors" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
