"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, LogOut, Bell, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAlerts, useDismissAlert } from "@/hooks/use-data";
import { timeAgo } from "@/lib/format";

export function TopBar() {
  const { data: session } = useSession();
  const { data: alerts = [] } = useAlerts(true);
  const dismiss = useDismissAlert();
  const unread = alerts.filter((a) => !a.read);

  return (
    <header className="h-14 shrink-0 border-b border-border bg-sidebar/80 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 flex items-center gap-3 px-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">SentinelSec</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Field Ops Console
          </div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-9 px-2">
              <Bell className="h-4 w-4" />
              {unread.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unread.length}
                </span>
              )}
              <span className="sr-only">Alerts</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover border-border">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Alerts</span>
              <Badge variant="secondary" className="text-[10px]">{unread.length} unread</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {unread.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No active alerts. All agents within assigned zones.
              </div>
            ) : (
              unread.slice(0, 6).map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  className="flex flex-col items-start gap-1 py-2"
                  onSelect={() => dismiss.mutate(a.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span className="text-xs font-medium truncate flex-1">
                      {a.agentName ?? "Agent"} · {a.agentBadge}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 px-2 gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/20 ring-1 ring-primary/40 flex items-center justify-center">
                <User2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs hidden sm:inline">{session?.user?.name ?? "Supervisor"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            <DropdownMenuLabel className="text-xs">
              <div className="font-medium">{session?.user?.name}</div>
              <div className="text-muted-foreground font-normal">{session?.user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
