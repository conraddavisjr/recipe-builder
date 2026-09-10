"use client";

import { useRef, useState } from "react";
import { Camera, LoaderCircle, Plus, X } from "lucide-react";
import type { Inspiration } from "@/lib/types";
import { api } from "@/lib/client/api";
import { uploadPhoto } from "@/lib/client/upload";
import { Field } from "@/components/ui/Field";

export function InspirationForm({ onCreated }: { onCreated: (i: Inspiration) => void }) {
  const [dish, setDish] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const photo_path = file ? await uploadPhoto(file) : null;
      const { inspiration } = await api<{ inspiration: Inspiration }>("/api/inspirations", {
        method: "POST",
        json: { dish_name: dish.trim(), restaurant_name: restaurant.trim(), city: city.trim(), notes: notes.trim(), photo_path },
      });
      onCreated(inspiration);
      setDish(""); setRestaurant(""); setCity(""); setNotes(""); pick(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-7">
      <div>
        <p className="eyebrow">New inspiration</p>
        <h2 className="display display-md mt-2">A dish you loved out</h2>
        <p className="mt-1 text-sm text-muted">Name the dish and the restaurant, add a photo if you have one. The agent researches it the moment you save.</p>
      </div>
      <Field label="Dish" htmlFor="dish">
        <input id="dish" className="input" value={dish} onChange={(e) => setDish(e.target.value)} placeholder="e.g. Khao soi" required maxLength={200} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Restaurant" htmlFor="restaurant">
          <input id="restaurant" className="input" value={restaurant} onChange={(e) => setRestaurant(e.target.value)} placeholder="e.g. Dee Dee" maxLength={200} />
        </Field>
        <Field label="City" htmlFor="city">
          <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin, TX" maxLength={120} />
        </Field>
      </div>
      <Field label="What you remember" htmlFor="notes" hint="Anything: what stood out, what you would change, what it came with.">
        <textarea id="notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} style={{ minHeight: "5rem" }} />
      </Field>
      <div>
        <span className="label">Photo</span>
        <div className="mt-1 flex items-center gap-3">
          {preview ? (
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Selected photo" className="h-20 w-20 rounded-xl object-cover" />
              <button type="button" aria-label="Remove photo" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-surface shadow" onClick={() => { pick(null); if (fileInput.current) fileInput.current.value = ""; }}>
                <X size={12} />
              </button>
            </span>
          ) : (
            <label className="btn cursor-pointer">
              <Camera size={16} /> Add a photo
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
            </label>
          )}
          <span className="text-xs text-muted">JPEG, PNG or WebP. Uploaded directly to storage.</span>
        </div>
      </div>
      {error && <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={busy || !dish.trim()}>
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} Save and research
        </button>
      </div>
    </form>
  );
}
