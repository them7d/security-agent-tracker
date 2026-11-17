"use client";

import { LayoutDashboard, Radio, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppView = "dashboard" | "map" | "logs";

const NAV: Array<{ id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map",       label: "Live Map",   icon: Radio },
  { id: "logs",      label: "Logs",       icon: ScrollText },
];

export function SideNav({ current, onChange }: { current: AppView; onChange: (v: AppView) => void }) {
  return (
    <nav className="w-14 md:w-52 shrink-0 border-r border-border bg-sidebar flex flex-col py-4">
      {NAV.map((item) => {
        const active = current === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-md text-sm transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="hidden md:inline truncate">{item.label}</span>
          </button>
        );
      })}
      <div className="mt-auto px-4 hidden md:block">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
          v1.0 · PostgreSQL
        </p>
      </div>
    </nav>
  );
}
