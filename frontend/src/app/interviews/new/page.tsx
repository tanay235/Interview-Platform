"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, useToast } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Difficulty = "easy" | "medium" | "hard";

export default function NewInterviewPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [form, setForm] = useState({ title: "", role: "", difficulty: "medium" as Difficulty, technologies: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) router.replace("/login");
  }, [isAuthLoading, router, user]);

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const technologies = form.technologies.split(",").map((technology) => technology.trim()).filter(Boolean);
    if (form.title.trim().length < 2 || form.role.trim().length < 2 || technologies.length === 0) {
      setError("Complete the title, role, and technologies fields.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await apiClient<{ success: boolean; message?: string; data?: { interview?: { id: string } } }>("/interviews", {
        method: "POST",
        body: JSON.stringify({ title: form.title, role: form.role, difficulty: form.difficulty, technologies }),
      });
      toast.success("Interview configuration saved");
      if (response.data?.interview?.id) router.push(`/interviews/${response.data.interview.id}/room`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save interview configuration");
    } finally {
      setIsSaving(false);
    }
  }

  if (isAuthLoading || !user) {
    return <div className="mx-auto max-w-3xl"><Card><CardContent><p className="text-sm text-muted">Loading interview setup...</p></CardContent></Card></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Interview workspace</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Create an interview</h2>
        <p className="mt-2 text-sm text-muted">Configure the interview topics and difficulty before you begin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview setup</CardTitle>
          <CardDescription>Your configuration will be saved to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Interview title" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Frontend engineering practice" required />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Role" value={form.role} onChange={(event) => updateField("role", event.target.value)} placeholder="Frontend Engineer" required />
              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="difficulty" className="text-sm font-medium text-foreground">Difficulty</label>
                <select id="difficulty" value={form.difficulty} onChange={(event) => updateField("difficulty", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/50">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <Input label="Technologies" helperText="Separate technologies with commas" value={form.technologies} onChange={(event) => updateField("technologies", event.target.value)} placeholder="React, TypeScript, Node.js" required />
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => router.push("/")}>Cancel</Button>
              <Button type="submit" isLoading={isSaving}>Save configuration</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
