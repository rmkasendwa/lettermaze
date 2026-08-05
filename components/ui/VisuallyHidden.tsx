import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const VisuallyHidden = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn("sr-only", className)} {...props} />
));
VisuallyHidden.displayName = "VisuallyHidden";
