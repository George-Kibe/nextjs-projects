"use client";

import dynamic from "next/dynamic";
import type { MapProps } from "./LeafletMap";

// Leaflet needs `window`, so the map only renders in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-900" />,
});

export default function SiteMap(props: MapProps) {
  return <LeafletMap {...props} />;
}
