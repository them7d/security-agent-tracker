"use client";

import { Loader2 } from "lucide-react";

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
        {label ?? "Loading…"}
      </p>
    </div>
  );
}
