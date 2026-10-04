"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { COUNTRY, KENYAN_COUNTIES } from "@/lib/counties";
import { FIELDS } from "@/lib/fields";
import { extraFields, KINDS, viewHref, type ExtraFieldKey, type KindKey } from "@/lib/kinds";
import { siteCode, validateSite, type FieldErrors, type Site, type SiteFields } from "@/lib/validation";

/** Form values are strings; "code" holds the kind's ID field (boreholeId / mineralId). */
type ValueKey = Exclude<keyof SiteFields, "country"> | ExtraFieldKey | "code";
type Values = Record<ValueKey, string>;

const SHARED_KEYS = ["latitude", "longitude", "elevation", "depth", "formation", "yield", "location", "county"] as const;

function toValues(kind: KindKey, site?: Site): Values {
  const values = { code: site ? siteCode(kind, site) : "" } as Values;
  for (const k of SHARED_KEYS) values[k] = site ? String(site[k]) : "";
  for (const { key } of extraFields(kind)) values[key] = site?.[key] ?? "";
  return values;
}

export default function SiteForm({ kind, site }: { kind: KindKey; site?: Site }) {
  const { idField, idLabel, idPlaceholder, singular } = KINDS[kind];
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => toValues(kind, site));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const errorKey = (name: ValueKey) => (name === "code" ? idField : name);

  function set(name: ValueKey, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    const key = errorKey(name);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const { code, ...shared } = values;
    const result = validateSite(kind, { ...shared, [idField]: code });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setPending(true);
    const res = await fetch(site ? `/api/${kind}/${site._id}` : `/api/${kind}`, {
      method: site ? "PUT" : "POST",
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
    router.push(`/${kind}/${body._id}`);
    router.refresh();
  }

  function field(name: ValueKey, props: React.InputHTMLAttributes<HTMLInputElement> = {}) {
    const extra = extraFields(kind).find((f) => f.key === name);
    const { label, unit } =
      name === "code" ? { label: idLabel, unit: undefined } : extra ? { label: extra.label, unit: undefined } : FIELDS[name as keyof typeof FIELDS];
    const error = errors[errorKey(name)];
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
  const extras = extraFields(kind);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <fieldset className={`grid gap-4 ${extras.length ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <legend className="mb-3 text-sm font-medium">Identification</legend>
        {field("code", { placeholder: idPlaceholder, autoComplete: "off" })}
        {extras.map((f) => <Fragment key={f.key}>{field(f.key, { placeholder: f.placeholder })}</Fragment>)}
        {field("formation", { placeholder: "e.g. Basalt, Volcanic tuff" })}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-3 text-sm font-medium">Position</legend>
        {field("latitude", { ...num, placeholder: "-1.2921" })}
        {field("longitude", { ...num, placeholder: "36.8219" })}
        {field("elevation", { ...num, placeholder: "1795" })}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-medium">Measurements</legend>
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
          {pending ? "Saving…" : site ? "Save changes" : `Create ${singular}`}
        </button>
        <Link href={site ? `/${kind}/${site._id}` : viewHref("/", kind)} className="btn">
          Cancel
        </Link>
      </div>
    </form>
  );
}
