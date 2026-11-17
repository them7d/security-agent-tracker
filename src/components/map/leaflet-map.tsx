"use client";

import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HQ_DEFAULT } from "./map-constants";
import type { AgentDTO, LatLng } from "@/lib/types";

interface Props {
  agents: AgentDTO[];
  selectedId: string | null;
  draftPoints: LatLng[] | null;
  drawingAgentId: string | null;
  onClickPoint: (point: LatLng) => void;
  onSelectAgent: (a: AgentDTO) => void;
  focusAgentId?: string | null;
}

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function LeafletMap({
  agents, selectedId, draftPoints, drawingAgentId, onClickPoint, onSelectAgent, focusAgentId,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const markersRef = React.useRef<Map<string, L.Marker>>(new Map());
  const geofenceRef = React.useRef<Map<string, L.Polygon>>(new Map());
  const draftLayerRef = React.useRef<L.Polygon | null>(null);
  const draftMarkersRef = React.useRef<L.Marker[]>([]);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [HQ_DEFAULT.lat, HQ_DEFAULT.lng],
      zoom: 14, zoomControl: true, attributionControl: true, preferCanvas: false,
    });
    tileLayerRef.current = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR, subdomains: "abcd", maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersRef.current.clear();
      geofenceRef.current.clear();
      draftLayerRef.current = null;
      draftMarkersRef.current = [];
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      onClickPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [onClickPoint]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    container.style.cursor = draftPoints !== null ? "crosshair" : "";
  }, [draftPoints]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    for (const agent of agents) {
      seen.add(agent.id);
      const existing = geofenceRef.current.get(agent.id);
      if (agent.geofence.length >= 3) {
        const latlngs: L.LatLngExpression[] = agent.geofence.map((p) => [p.lat, p.lng]);
        const outside = !agent.inGeofence;
        const fill = outside ? "#ef4444" : "#f5a524";
        if (existing) {
          existing.setLatLngs(latlngs);
          existing.setStyle({ color: fill, fillColor: fill, fillOpacity: outside ? 0.18 : 0.08 });
        } else {
          const poly = L.polygon(latlngs, {
            color: fill, weight: 1.5, opacity: 0.9,
            fillColor: fill, fillOpacity: outside ? 0.18 : 0.08,
            dashArray: outside ? "4,4" : undefined, interactive: false,
          }).addTo(map);
          geofenceRef.current.set(agent.id, poly);
        }
      } else if (existing) {
        existing.remove();
        geofenceRef.current.delete(agent.id);
      }
    }
    for (const [id, poly] of geofenceRef.current.entries()) {
      if (!seen.has(id)) { poly.remove(); geofenceRef.current.delete(id); }
    }
  }, [agents]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    for (const agent of agents) {
      seen.add(agent.id);
      const hasGeofence = agent.geofence.length >= 3;
      const outside = hasGeofence && !agent.inGeofence;
      const isSelected = agent.id === selectedId;
      const isDrawingTarget = agent.id === drawingAgentId;
      const color =
        outside ? "#ef4444" :
        agent.status === "on_duty" ? "#10b981" :
        agent.status === "patrol" ? "#38bdf8" : "#94a3b8";
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:0;height:0;">
            <div class="agent-marker__pulse ${outside ? "agent-marker__pulse--danger" : ""}"
                 style="position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;background:${color};opacity:0.35;"></div>
            <div style="position:absolute;left:-10px;top:-10px;width:20px;height:20px;border-radius:50%;
                        background:${color};border:2px solid ${isSelected ? "#fff" : "#0a0e1a"};
                        box-shadow:0 0 0 ${isDrawingTarget ? "4px" : "2px"} ${isDrawingTarget ? "#f5a524" : "rgba(0,0,0,0.4)"};"></div>
          </div>
        `,
        iconSize: [0, 0],
      });
      const existing = markersRef.current.get(agent.id);
      if (existing) {
        existing.setLatLng([agent.lat, agent.lng]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([agent.lat, agent.lng], { icon, zIndexOffset: 1000 }).addTo(map);
        marker.on("click", () => onSelectAgent(agent));
        markersRef.current.set(agent.id, marker);
      }
    }
    for (const [id, marker] of markersRef.current.entries()) {
      if (!seen.has(id)) { marker.remove(); markersRef.current.delete(id); }
    }
  }, [agents, selectedId, drawingAgentId, onSelectAgent]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (draftLayerRef.current) { draftLayerRef.current.remove(); draftLayerRef.current = null; }
    draftMarkersRef.current.forEach((m) => m.remove());
    draftMarkersRef.current = [];
    if (!draftPoints || draftPoints.length === 0) return;
    for (let i = 0; i < draftPoints.length; i++) {
      const p = draftPoints[i];
      const idx = i + 1;
      const m = L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:18px;height:18px;left:-9px;top:-9px;">
              <div style="width:18px;height:18px;border-radius:50%;background:#f5a524;border:2px solid #0a0e1a;"></div>
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#0a0e1a;font-size:9px;font-weight:700;font-family:monospace;">${idx}</div>
            </div>
          `,
          iconSize: [18, 18],
        }),
        interactive: false,
      }).addTo(map);
      draftMarkersRef.current.push(m);
    }
    if (draftPoints.length >= 2) {
      const latlngs: L.LatLngExpression[] = draftPoints.map((p) => [p.lat, p.lng]);
      if (draftPoints.length >= 3) {
        draftLayerRef.current = L.polygon(latlngs, {
          color: "#f5a524", weight: 1.5, dashArray: "4,4",
          fillColor: "#f5a524", fillOpacity: 0.12, interactive: false,
        }).addTo(map);
      } else {
        draftLayerRef.current = L.polyline(latlngs, {
          color: "#f5a524", weight: 1.5, dashArray: "4,4", interactive: false,
        }).addTo(map);
      }
    }
  }, [draftPoints]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const targetId = focusAgentId ?? selectedId;
    if (!targetId) return;
    const agent = agents.find((a) => a.id === targetId);
    if (!agent) return;
    map.setView([agent.lat, agent.lng], Math.max(map.getZoom(), 16), { animate: true });
  }, [focusAgentId, selectedId, agents]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
