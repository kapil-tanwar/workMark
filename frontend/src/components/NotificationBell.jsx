import { useEffect, useState, useCallback } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    // Also listen to window focus to refresh
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button aria-label="Notifications" className="relative size-9 rounded-full border border-border bg-card/70 hover:bg-muted hover:border-input transition-all flex items-center justify-center active:scale-95">
          <Bell className="size-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline shrink-0">
          <DropdownMenuLabel className="font-headline font-semibold p-0 text-[15px] tracking-[-0.02em]">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8 text-xs text-primary font-semibold hover:bg-primary-fixed hover:text-primary">
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <span className="size-11 rounded-2xl bg-muted border border-border grid place-items-center"><Bell className="size-5 opacity-60" /></span>
              <p className="font-medium text-foreground">You’re all caught up</p>
              <p className="text-xs">New updates will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {notifications.map(n => (
                <div 
                  key={n._id} 
                  className={cn(
                    "p-4 transition-colors relative flex gap-3 group",
                    !n.isRead ? "bg-primary-fixed/50" : "hover:bg-muted/50"
                  )}
                >
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className={cn("text-sm font-semibold truncate", !n.isRead ? "text-foreground" : "text-foreground/80")}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button 
                      onClick={(e) => handleMarkAsRead(n._id, e)}
                      className="shrink-0 size-6 rounded-full flex items-center justify-center bg-background border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground"
                      title="Mark as read"
                    >
                      <Check className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
