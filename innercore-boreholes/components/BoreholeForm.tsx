"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { COUNTRY, KENYAN_COUNTIES } from "@/lib/counties";
import { FIELDS } from "@/lib/fields";
import { validateBorehole, type Borehole, type BoreholeInput, type FieldErrors } from "@/lib/validation";

type Values = Record<Exclude<keyof BoreholeInput, "country">, string>;

const EMPTY: Values = {
  boreholeId: "",
  latitude: "",
  longitude: "",
  elevation: "",
  depth: "",
  formation: "",
  yield: "",
  location: "",
  county: "",
};

function toValues(b?: Borehole): Values {
  if (!b) return EMPTY;
  return Object.fromEntries(Object.keys(EMPTY).map((k) => [k, String(b[k as keyof Values])])) as Values;
}

export default function BoreholeForm({ borehole }: { borehole?: Borehole }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => toValues(borehole));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  function set(field: keyof Values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const result = validateBorehole(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setPending(true);
    const res = await fetch(borehole ? `/api/boreholes/${borehole._id}` : "/api/boreholes", {
      method: borehole ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setPending(false);

    if (!res?.ok) {
      if (res?.status === 401) {
        router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        return;
      }
      if (body?.fields) setErrors(body.fields);
      setFormError(body?.error ?? "Could not save. Please try again.");
      return;
    }
    router.push(`/boreholes/${body._id}`);
    router.refresh();
  }

  function field(name: keyof Values, props: React.InputHTMLAttributes<HTMLInputElement> = {}) {
    const { label, unit } = FIELDS[name];
    const error = errors[name];
    return (
      <div>
        <label htmlFor={name} className="label">
          {label} {unit && <span className="normal-case">({unit})</span>}
        </label>
        <input
          id={name}
          name={name}
          value={values[name]}
          onChange={(e) => set(name, e.target.value)}
          aria-invalid={!!error}
          className={`input ${error ? "border-red-500 dark:border-red-500" : ""}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  const num = { type: "number", step: "any", inputMode: "decimal" } as const;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-medium">Identification</legend>
        {field("boreholeId", { placeholder: "e.g. BH-001", autoComplete: "off" })}
        {field("formation", { placeholder: "e.g. Basalt, Volcanic tuff" })}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-3 text-sm font-medium">Position</legend>
        {field("latitude", { ...num, placeholder: "-1.2921" })}
        {field("longitude", { ...num, placeholder: "36.8219" })}
        {field("elevation", { ...num, placeholder: "1795" })}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-medium">Hydrogeology</legend>
        {field("depth", { ...num, min: 0, placeholder: "120" })}
        {field("yield", { ...num, min: 0, placeholder: "4.5" })}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-3 text-sm font-medium">Location</legend>
        {field("location", { placeholder: "Village, ward or site name" })}
        <div>
          <label htmlFor="county" className="label">
            County
          </label>
          <select
            id="county"
            value={values.county}
            onChange={(e) => set("county", e.target.value)}
            aria-invalid={!!errors.county}
            className={`input ${errors.county ? "border-red-500 dark:border-red-500" : ""}`}
          >
            <option value="">Select…</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {errors.county && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.county}</p>}
        </div>
        <div>
          <label htmlFor="country" className="label">
            Country
          </label>
          <input id="country" value={COUNTRY} readOnly disabled className="input opacity-60" />
        </div>
      </fieldset>

      {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

      <div className="flex gap-2 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : borehole ? "Save changes" : "Create borehole"}
        </button>
        <Link href={borehole ? `/boreholes/${borehole._id}` : "/"} className="btn">
          Cancel
        </Link>
      </div>
    </form>
  );
}
