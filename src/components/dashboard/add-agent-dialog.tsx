"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, UserPlus, MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAgent } from "@/hooks/use-data";
import { HQ_DEFAULT } from "@/components/map/map-constants";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  badgeId: z.string().min(2, "Badge ID is required"),
  phone: z.string().optional(),
  areaLabel: z.string().optional(),
  lat: z.string().refine((v) => !Number.isNaN(parseFloat(v)), "Invalid lat"),
  lng: z.string().refine((v) => !Number.isNaN(parseFloat(v)), "Invalid lng"),
});
type FormValues = z.infer<typeof schema>;

export function AddAgentDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const create = useCreateAgent();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      badgeId: "",
      phone: "",
      areaLabel: "",
      lat: HQ_DEFAULT.lat.toFixed(5),
      lng: HQ_DEFAULT.lng.toFixed(5),
    },
  });

  const areaPreset = watch("areaLabel");

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      badgeId: values.badgeId,
      phone: values.phone,
      areaLabel: values.areaLabel,
      lat: parseFloat(values.lat),
      lng: parseFloat(values.lng),
      geofence: [] as { lat: number; lng: number }[],
    };
    try {
      await create.mutateAsync(payload);
      toast.success(`Agent ${values.badgeId} added to roster`);
      reset();
      setOpen(false);
      onCreated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add agent");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" /> Add agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-popover border-border">
        <DialogHeader>
          <DialogTitle>Add new agent</DialogTitle>
          <DialogDescription>
            Add a field agent to the roster. The agent will start with no geofence;
            draw their work area on the Live Map page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Full name
              </Label>
              <Input {...register("name")} placeholder="Karim Haddad" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Badge ID
              </Label>
              <Input {...register("badgeId")} placeholder="SC-0146" />
              {errors.badgeId && (
                <p className="text-xs text-destructive">{errors.badgeId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Phone
              </Label>
              <Input {...register("phone")} placeholder="+964 ..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Area label
              </Label>
              <Input {...register("areaLabel")} placeholder="Karkh gate" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Initial latitude
              </Label>
              <Input {...register("lat")} placeholder="33.3152" />
              {errors.lat && (
                <p className="text-xs text-destructive">{errors.lat.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Initial longitude
              </Label>
              <Input {...register("lng")} placeholder="44.3661" />
              {errors.lng && (
                <p className="text-xs text-destructive">{errors.lng.message}</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Tip: leave the coordinates at the HQ default; once added, open the Live Map
            to drop the agent marker and draw their assigned work area as a polygon.
          </p>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
