import KindSwitch from "@/components/KindSwitch";
import MapView from "@/components/MapView";
import { DEFAULT_KIND, parseKind } from "@/lib/kinds";

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const raw = (await searchParams).kind;
  const kind = parseKind(typeof raw === "string" ? raw : null) ?? DEFAULT_KIND;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Map</h1>
        <KindSwitch path="/map" active={kind} />
      </div>
      <MapView kind={kind} />
    </div>
  );
}
