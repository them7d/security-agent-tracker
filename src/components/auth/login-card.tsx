"use client";

import * as React from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Loader2, Lock, User2, IdCard, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Role = "supervisor" | "agent";

const supervisorSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const agentSchema = z.object({
  badgeId: z.string().min(2, "Badge ID is required"),
  pin: z
    .string()
    .length(4, "PIN must be 4 digits")
    .regex(/^\d{4}$/, "PIN must be 4 digits"),
});

type SupervisorValues = z.infer<typeof supervisorSchema>;
type AgentValues = z.infer<typeof agentSchema>;

export function LoginCard() {
  const router = useRouter();
  const { update } = useSession();
  const [role, setRole] = React.useState<Role>("supervisor");
  const [submitting, setSubmitting] = React.useState(false);

  const supervisorForm = useForm<SupervisorValues>({
    resolver: zodResolver(supervisorSchema),
    defaultValues: {
      email: "supervisor@sentinel.sec",
      password: "Sentinel#2025",
    },
  });

  const agentForm = useForm<AgentValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: { badgeId: "SC-0142", pin: "0142" },
  });

  async function onSupervisorSubmit(values: SupervisorValues) {
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        role: "supervisor",
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (!res || res.error) {
        toast.error("Invalid supervisor credentials.");
        return;
      }
      // Critical: forces useSession to refetch the new JWT-bearing cookie
      await update();
      toast.success("Authenticated. Welcome back, Supervisor.");
      // Force a full re-render of the route — AppShell will now branch to the
      // supervisor console because session.user.role === "supervisor".
      router.replace("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function onAgentSubmit(values: AgentValues) {
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        role: "agent",
        badgeId: values.badgeId,
        pin: values.pin,
        redirect: false,
      });
      if (!res || res.error) {
        toast.error("Invalid agent credentials. Check badge ID and PIN.");
        return;
      }
      await update();
      toast.success("Signed in. Loading agent console…");
      router.replace("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 tactical-grid">
      <Card className="w-full max-w-md border-border/80 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SentinelSec</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Field Operations · {role === "supervisor" ? "Supervisor console" : "Agent console"}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-1 mb-5 p-1 rounded-md bg-secondary/60 border border-border">
            <button
              type="button"
              onClick={() => setRole("supervisor")}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                role === "supervisor"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <User2 className="h-3.5 w-3.5" /> Supervisor
            </button>
            <button
              type="button"
              onClick={() => setRole("agent")}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                role === "agent"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <IdCard className="h-3.5 w-3.5" /> Agent
            </button>
          </div>

          {role === "supervisor" ? (
            <form
              onSubmit={supervisorForm.handleSubmit(onSupervisorSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <Input
                  type="email"
                  autoComplete="email"
                  className="bg-secondary/40"
                  {...supervisorForm.register("email")}
                />
                {supervisorForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {supervisorForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  className="bg-secondary/40"
                  {...supervisorForm.register("password")}
                />
                {supervisorForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {supervisorForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" /> Sign in to supervisor console
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={agentForm.handleSubmit(onAgentSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Badge ID
                </Label>
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="SC-0142"
                  className="bg-secondary/40 font-mono"
                  {...agentForm.register("badgeId")}
                />
                {agentForm.formState.errors.badgeId && (
                  <p className="text-xs text-destructive">
                    {agentForm.formState.errors.badgeId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  PIN (4 digits)
                </Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="current-password"
                  placeholder="0142"
                  className="bg-secondary/40 font-mono tracking-[0.4em]"
                  {...agentForm.register("pin")}
                />
                {agentForm.formState.errors.pin && (
                  <p className="text-xs text-destructive">
                    {agentForm.formState.errors.pin.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating…
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" /> Start shift
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6">
            <Separator />
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p className="font-mono uppercase tracking-wider text-[10px]">
                Demo credentials
              </p>
              {role === "supervisor" ? (
                <>
                  <p>
                    <span className="text-foreground/80">email</span> · supervisor@sentinel.sec
                  </p>
                  <p>
                    <span className="text-foreground/80">pass</span> · Sentinel#2025
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <span className="text-foreground/80">badge</span> · SC-0142
                  </p>
                  <p>
                    <span className="text-foreground/80">pin</span> · 0142 (last 4 of badge)
                  </p>
                  <p className="text-[10px] italic mt-1">
                    Agents: SC-0142 → 0142, SC-0143 → 0143, SC-0144 → 0144, SC-0145 → 0145
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
