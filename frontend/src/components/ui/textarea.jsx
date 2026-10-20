import * as React from "react";
import { cn } from "@/lib/utils";
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
    return (<textarea className={cn("flex min-h-[84px] w-full rounded-xl border border-input bg-surface px-4 py-3 text-base shadow-sm transition-all hover:border-foreground/25 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)} ref={ref} {...props}/>);
});
Textarea.displayName = "Textarea";
export { Textarea };
