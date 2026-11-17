"use client";

import { Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSendOrder } from "@/hooks/use-data";
import type { OrderPriority } from "@/lib/types";

const schema = z.object({
  body: z.string().min(1, "Order cannot be empty").max(500),
  priority: z.enum(["low", "normal", "high", "critical"]),
});
type FormValues = z.infer<typeof schema>;

const PRIORITIES: { value: OrderPriority; label: string }[] = [
  { value: "low",      label: "Low" },
  { value: "normal",   label: "Normal" },
  { value: "high",     label: "High" },
  { value: "critical", label: "Critical" },
];

export function SendOrderForm({ agentId }: { agentId: string }) {
  const send = useSendOrder();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { body: "", priority: "normal" },
  });
  const priority = watch("priority");

  async function onSubmit(values: FormValues) {
    try {
      await send.mutateAsync({ agentId, body: values.body, priority: values.priority });
      toast.success("Order dispatched");
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Priority</Label>
        <Select value={priority} onValueChange={(v) => setValue("priority", v as OrderPriority)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Order</Label>
        <Textarea rows={3} placeholder="e.g. Proceed to north gate, confirm vendor handover, then return to HQ." className="resize-none" {...register("body")} />
        {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
      </div>
      <Button type="submit" size="sm" disabled={send.isPending} className="w-full">
        {send.isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Dispatching…</>
        ) : (
          <><Send className="h-4 w-4 mr-2" /> Dispatch order</>
        )}
      </Button>
    </form>
  );
}
