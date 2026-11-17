"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, LogOut, User2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeNav() {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const isAuthed = !!session?.user;
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">SentinelSec</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Field Operations Platform
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/#what" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              What is it
            </Link>
            <Link href="/#features" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#roles" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Roles
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {!isAuthed && (
              <Button asChild size="sm">
                <Link href="/login"><User2 className="h-4 w-4 mr-2" /> Sign in</Link>
              </Button>
            )}
            {isAuthed && role === "supervisor" && (
              <Button asChild size="sm"><Link href="/dashboard">Go to dashboard</Link></Button>
            )}
            {isAuthed && role === "agent" && (
              <Button asChild size="sm"><Link href="/agent">Go to console</Link></Button>
            )}
            {isAuthed && (
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </Button>
            )}
          </div>

          <button
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            <Link href="/#what" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded-md hover:bg-accent">What is it</Link>
            <Link href="/#features" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded-md hover:bg-accent">Features</Link>
            <Link href="/#roles" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded-md hover:bg-accent">Roles</Link>
            <div className="pt-2 border-t border-border mt-2">
              {!isAuthed && (
                <Button asChild size="sm" className="w-full"><Link href="/login">Sign in</Link></Button>
              )}
              {isAuthed && role === "supervisor" && (
                <Button asChild size="sm" className="w-full"><Link href="/dashboard">Go to dashboard</Link></Button>
              )}
              {isAuthed && role === "agent" && (
                <Button asChild size="sm" className="w-full"><Link href="/agent">Go to console</Link></Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
