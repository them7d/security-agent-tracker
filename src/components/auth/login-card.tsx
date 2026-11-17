"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginCard({ onLoggedIn }: { onLoggedIn?: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "supervisor@sentinel.sec",
      password: "Sentinel#2025",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setSubmitting(false);
    if (!res || res.error) {
      toast.error("Invalid credentials. Use the demo account below.");
      return;
    }
    toast.success("Authenticated. Welcome back, Supervisor.");
    onLoggedIn?.();
    router.refresh();
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
              Field Agent Operations Console · Supervisor access only
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="bg-secondary/40"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="bg-secondary/40"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" /> Sign in to console
                </>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <Separator />
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p className="font-mono uppercase tracking-wider text-[10px]">Demo credentials</p>
              <p><span className="text-foreground/80">email</span> · supervisor@sentinel.sec</p>
              <p><span className="text-foreground/80">pass</span> · Sentinel#2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
