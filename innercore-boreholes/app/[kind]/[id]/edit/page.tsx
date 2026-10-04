import { notFound } from "next/navigation";
import EditSite from "@/components/EditSite";
import { KINDS, parseKind } from "@/lib/kinds";

export default async function EditSitePage({ params }: PageProps<"/[kind]/[id]/edit">) {
  const { kind: rawKind, id } = await params;
  const kind = parseKind(rawKind);
  if (!kind) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-xl font-semibold tracking-tight">Edit {KINDS[kind].singular}</h1>
      <EditSite kind={kind} id={id} />
    </div>
  );
}
