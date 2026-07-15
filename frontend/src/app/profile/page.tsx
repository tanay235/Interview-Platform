"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, useToast } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ProfileResponse, User } from "@/types";

const experienceOptions = [
  ["student", "Student"],
  ["entry", "Entry level"],
  ["mid", "Mid level"],
  ["senior", "Senior level"],
  ["lead", "Lead / Principal"],
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoading: isAuthLoading, updateProfile } = useAuth();
  const [form, setForm] = useState<Omit<User, "id"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    apiClient<ProfileResponse>("/users/profile")
      .then((response) => setForm(response.data.user))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load profile"))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, router, user]);

  function updateField<Key extends keyof Omit<User, "id">>(key: Key, value: Omit<User, "id">[Key]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setError("");
    if (form.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Enter a valid name and email.");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
      toast.success("Profile updated successfully");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  if (isAuthLoading || isLoading || !form) {
    return <div className="mx-auto max-w-3xl"><Card><CardContent><p className="text-sm text-muted">Loading profile...</p></CardContent></Card></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Account settings</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Your profile</h2>
        <p className="mt-2 text-sm text-muted">Keep your information current so interviews can be tailored to your goals.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile information</CardTitle>
          <CardDescription>Update the details used across your interview workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
              <Input label="Email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            </div>
            <Input label="Skills" helperText="Separate skills with commas" value={form.skills.join(", ")} onChange={(event) => updateField("skills", event.target.value.split(","))} placeholder="React, TypeScript, Node.js" />
            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="experience-level" className="text-sm font-medium text-foreground">Experience level</label>
              <select id="experience-level" value={form.experienceLevel} onChange={(event) => updateField("experienceLevel", event.target.value as User["experienceLevel"])} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/50">
                {experienceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <Input label="Preferred role" value={form.preferredRole} onChange={(event) => updateField("preferredRole", event.target.value)} placeholder="Senior Frontend Engineer" />
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex justify-end border-t border-border pt-5">
              <Button type="submit" isLoading={isSaving}>Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
