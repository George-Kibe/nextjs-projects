"use client";

import BoreholeForm from "./BoreholeForm";
import { useBorehole } from "./useBorehole";

export default function EditBorehole({ id }: { id: string }) {
  const { borehole, error, loading } = useBorehole(id);
  if (loading) return <p className="muted text-sm">Loading…</p>;
  if (error || !borehole) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  return <BoreholeForm borehole={borehole} />;
}
