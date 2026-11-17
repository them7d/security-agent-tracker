import { formatDistanceToNow, format } from "date-fns";

export function timeAgo(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return "—"; }
}
export function fmtDateTime(iso: string): string {
  try { return format(new Date(iso), "yyyy-MM-dd HH:mm:ss"); } catch { return "—"; }
}
export function fmtTime(iso: string): string {
  try { return format(new Date(iso), "HH:mm:ss"); } catch { return "—"; }
}
export function fmtCoords(lat: number, lng: number, digits = 5): string {
  return `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`;
}
