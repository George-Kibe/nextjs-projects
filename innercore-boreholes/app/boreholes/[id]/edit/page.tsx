import EditBorehole from "@/components/EditBorehole";

export default async function EditBoreholePage({ params }: PageProps<"/boreholes/[id]/edit">) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-xl font-semibold tracking-tight">Edit borehole</h1>
      <EditBorehole id={id} />
    </div>
  );
}
