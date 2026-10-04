"use client";

// Also imported in globals.css; importing here too guarantees the styles ship with the map itself.
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect } from "react";
import { CircleMarker, LayerGroup, LayersControl, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { formatNumber } from "@/lib/fields";
import { KINDS, type KindKey } from "@/lib/kinds";
import { siteCode, type Site } from "@/lib/validation";

export type MapProps = { kind: KindKey; sites: Site[]; className?: string; height?: string; zoom?: number };

const KENYA_CENTER: [number, number] = [0.2, 37.9];

function FitBounds({ sites, zoom }: { sites: Site[]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    // The container can change size after Leaflet measures it (layout, fonts), which leaves the map blank.
    map.invalidateSize();
    if (sites.length === 1) map.setView([sites[0].latitude, sites[0].longitude], zoom);
    else if (sites.length > 1)
      map.fitBounds(sites.map((s) => [s.latitude, s.longitude]), { padding: [30, 30], maxZoom: 12 });
  }, [map, sites, zoom]);
  return null;
}

export default function LeafletMap({ kind, sites, className = "", height = "70vh", zoom = 6 }: MapProps) {
  const { color } = KINDS[kind];
  return (
    <MapContainer
      center={KENYA_CENTER}
      zoom={6}
      scrollWheelZoom
      // Inline height so the map can never collapse to 0px if a CSS class is missing.
      style={{ height, minHeight: 320 }}
      className={`${className} z-0 w-full rounded-lg border border-neutral-200 dark:border-neutral-800`}
    >
      {/* Both basemaps are free and need no API key. */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Light">
          <LayerGroup>
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={16}
              maxZoom={19}
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={16}
              maxZoom={19}
            />
          </LayerGroup>
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked name="Streets">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <FitBounds sites={sites} zoom={zoom} />
      {sites.map((b) => (
        <CircleMarker
          key={b._id}
          center={[b.latitude, b.longitude]}
          radius={7}
          pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 0.9 }}
        >
          <Popup>
            <div className="space-y-0.5 text-xs">
              <Link href={`/${kind}/${b._id}`} className="font-mono text-sm font-semibold">
                {siteCode(kind, b)}
              </Link>
              {b.name && <div className="font-semibold">{b.name}</div>}
              <div>
                {b.location}, {b.county}
              </div>
              <div>
                Depth {formatNumber(b.depth)} m · Yield {formatNumber(b.yield)} m³/h
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
