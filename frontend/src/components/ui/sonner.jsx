import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/hooks/use-theme";

const Toaster = ({ ...props }) => {
    const theme = useTheme();
    return (<Sonner theme={theme} className="toaster group" position="bottom-right" toastOptions={{
            classNames: {
                toast: "group toast group-[.toaster]:bg-popover group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:rounded-xl group-[.toaster]:shadow-[var(--shadow-lg)]",
                description: "group-[.toast]:text-muted-foreground",
                actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
        }} {...props}/>);
};
export { Toaster };
