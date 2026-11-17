"use client";

import Link from "next/link";
import {
  ShieldCheck, MapPin, Radio, Send, ScrollText, Bell, Users, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HomeNav } from "./home-nav";

const FEATURES = [
  {
    icon: Radio,
    title: "Live GPS tracking",
    body: "See every agent's exact location on a tactical map, refreshed every few seconds.",
  },
  {
    icon: MapPin,
    title: "Geofence enforcement",
    body: "Draw each agent's assigned work area as a polygon. The moment they step out, you know.",
  },
  {
    icon: Bell,
    title: "Instant alerts",
    body: "A bell badge in the topbar lights up the moment an agent leaves their zone or re-enters it.",
  },
  {
    icon: Send,
    title: "Order dispatch",
    body: "Send priority-tagged orders straight to a specific agent's console. They acknowledge with one click.",
  },
  {
    icon: ScrollText,
    title: "Attendance logging",
    body: "Automatic check-in / check-out rows the moment an agent enters or leaves their geofence. Departure and arrival times are recorded to the second.",
  },
  {
    icon: Users,
    title: "Two role-based consoles",
    body: "One platform, two experiences: a dense tactical dashboard for supervisors, a focused idle screen for agents in the field.",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HomeNav />

      {/* HERO */}
      <section className="relative hero-radial border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 text-[10px] py-0.5 px-2 uppercase tracking-wider border-primary/40 text-primary">
              <ShieldCheck className="h-3 w-3 mr-1" /> Securities field operations
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
              Track every agent.
              <br />
              <span className="text-primary">Enforce every zone.</span>
              <br />
              Dispatch every order.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              SentinelSec is a security operations console for securities companies. It shows
              you where every field guard is right now, alerts you the moment one leaves their
              assigned post, and lets you push orders directly to their device.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Sign in as supervisor <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">
                  Sign in as agent
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-mono">
              Demo · supervisor@sentinel.sec / Sentinel#2025 · Agent SC-0142 / PIN 0142
            </p>
          </div>
        </div>
      </section>

      {/* WHAT IS IT */}
      <section id="what" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-primary font-mono mb-3">
                What is SentinelSec
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
                A single pane of glass for your entire field force.
              </h2>
            </div>
            <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
              <p>
                If your company deploys guards across multiple sites — gates, plazas, markets,
                corporate lobbies — you need to know three things at all times: <strong className="text-foreground">where</strong> each
                guard is, <strong className="text-foreground">whether</strong> they&apos;re inside their assigned zone, and <strong className="text-foreground">how</strong> to
                reach them with new instructions.
              </p>
              <p>
                SentinelSec answers all three. Each agent&apos;s phone sends GPS pings to the
                platform. The supervisor draws a geofence polygon around the agent&apos;s
                assigned work area on the live map. The platform compares the two in real time
                and fires an alert the moment a guard steps outside their zone — with the
                departure time logged to the second for payroll and compliance.
              </p>
              <p>
                When the supervisor needs to redirect a guard — &ldquo;proceed to the north
                gate&rdquo;, &ldquo;suspect package reported, hold position&rdquo; — they click
                the agent on the map, type the order, set a priority, and dispatch. The
                agent&apos;s idle console lights up with the order within seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-border bg-sidebar/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-[10px] uppercase tracking-wider text-primary font-mono mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              Built for the control room, the field, and the compliance file.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="border-border/60 hover:border-primary/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="h-10 w-10 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight mb-1.5">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-[10px] uppercase tracking-wider text-primary font-mono mb-3">Two consoles</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              One platform. Two purpose-built experiences.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">For supervisors</h3>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      /dashboard
                    </p>
                  </div>
                </div>
                <Separator />
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Manage the agent roster — add, delete, edit</li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Live map with all agents, geofences, and OUT badges</li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Draw work-area polygons per agent</li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Dispatch orders with priority + body</li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Review attendance + alert logs</li>
                </ul>
                <Button asChild size="sm" className="w-full">
                  <Link href="/login">Open supervisor console</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center">
                    <Radio className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">For agents</h3>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      /agent
                    </p>
                  </div>
                </div>
                <Separator />
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Sign in with badge ID + 4-digit PIN</li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> See your live position + zone status</li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Idle screen — keep open during shift</li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Get notified the instant an order arrives</li>
                  <li className="flex gap-2"><span className="text-primary mt-0.5">▸</span> Acknowledge → Mark complete in one click</li>
                </ul>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href="/login">Open agent console</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Ready to take control of your field force?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Sign in to the demo and watch the live map light up. Pre-seeded with four agents
            patrolling downtown Baghdad.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/login">Sign in <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-border bg-sidebar/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight">SentinelSec</span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            v1.0 · Next.js 16 · PostgreSQL 17 · NextAuth · Leaflet
          </p>
        </div>
      </footer>
    </div>
  );
}
