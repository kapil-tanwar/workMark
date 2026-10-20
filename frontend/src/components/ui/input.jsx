import * as React from "react";
import { cn } from "@/lib/utils";
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (<input type={type} className={cn("flex h-11 w-full rounded-xl border border-input bg-surface px-4 py-2 text-sm shadow-sm transition-all hover:border-foreground/25 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-not-allowed hover:disabled:cursor-not-allowed hover:read-only:cursor-not-allowed", className)} ref={ref} {...props}/>);
});
Input.displayName = "Input";
export { Input };
