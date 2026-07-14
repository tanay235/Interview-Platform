"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email) || form.password.length < 8) {
      setError("Use a valid name, email, and password of at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signup(form.name, form.email, form.password);
      toast.success("Account created successfully");
      router.push("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12"><Card className="w-full max-w-md"><CardHeader><CardTitle>Create your account</CardTitle><CardDescription>Start preparing for your next interview</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><Input label="Full name" value={form.name} onChange={update("name")} required /><Input label="Email" type="email" value={form.email} onChange={update("email")} required /><Input label="Password" type="password" helperText="At least 8 characters" value={form.password} onChange={update("password")} required /><Input label="Confirm password" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} required />{error && <p className="text-sm text-error">{error}</p>}<Button type="submit" fullWidth isLoading={isSubmitting}>Create account</Button></form><p className="mt-6 text-center text-sm text-muted">Already have an account? <Link className="text-primary hover:underline" href="/login">Log in</Link></p></CardContent></Card></main>;
}
