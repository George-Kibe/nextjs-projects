import { notFound } from "next/navigation";
import SiteForm from "@/components/SiteForm";
import { KINDS, parseKind } from "@/lib/kinds";

export default async function NewSitePage({ params }: PageProps<"/[kind]/new">) {
  const kind = parseKind((await params).kind);
  if (!kind) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-xl font-semibold tracking-tight">New {KINDS[kind].singular}</h1>
      <SiteForm kind={kind} />
    </div>
  );
}
