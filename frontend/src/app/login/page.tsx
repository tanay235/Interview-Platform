"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email) || !password) {
      setError("Enter a valid email and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      router.push("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to log in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <AuthCard title="Welcome back" description="Sign in to continue to your interview workspace">
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
      <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" fullWidth isLoading={isSubmitting}>Log in</Button>
    </form>
    <p className="mt-6 text-center text-sm text-muted">Don&apos;t have an account? <Link className="text-primary hover:underline" href="/signup">Create one</Link></p>
  </AuthCard>;
}

function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12"><Card className="w-full max-w-md"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card></main>;
}
