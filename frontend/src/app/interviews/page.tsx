"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Loader, useToast } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface InterviewSummary {
  id: string;
  title: string;
  role: string;
  difficulty: "easy" | "medium" | "hard";
  technologies: string[];
  status: "in-progress" | "completed";
  answeredQuestions: number;
  totalQuestions: number;
  createdAt: string;
}

export default function InterviewHistoryPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    apiClient<{ success: boolean; data: { interviews: InterviewSummary[] } }>("/interviews")
      .then((response) => setInterviews(response.data.interviews))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load interview history"))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, router, user]);

  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return interviews;
    return interviews.filter((interview) => [interview.title, interview.role, ...interview.technologies].some((value) => value.toLowerCase().includes(query)));
  }, [interviews, search]);

  async function handleDelete(interview: InterviewSummary) {
    if (!window.confirm(`Delete “${interview.title}” and its history?`)) return;
    try {
      await apiClient<{ success: boolean }>(`/interviews/${interview.id}`, { method: "DELETE" });
      setInterviews((current) => current.filter((item) => item.id !== interview.id));
      toast.success("Interview history deleted");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Unable to delete interview");
    }
  }

  if (isAuthLoading || isLoading) return <div className="flex justify-center py-16"><Loader size="lg" /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Your workspace</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Interview history</h2>
          <p className="mt-2 text-sm text-muted">Review previous interview sessions and results.</p>
        </div>
        <Button onClick={() => router.push("/interviews/new")}>Create interview</Button>
      </div>

      <Card padding="none">
        <CardHeader className="mb-0 gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><CardTitle>All interviews</CardTitle><CardDescription className="mt-1">{interviews.length} saved interview{interviews.length === 1 ? "" : "s"}</CardDescription></div>
          <Input aria-label="Search interviews" placeholder="Search interviews..." value={search} onChange={(event) => setSearch(event.target.value)} className="sm:max-w-xs" />
        </CardHeader>
        <CardContent className="p-0">
          {error && <p className="px-5 py-6 text-sm text-error">{error}</p>}
          {!error && filteredInterviews.length === 0 && <div className="px-5 py-12 text-center"><p className="text-sm font-medium text-foreground">{search ? "No interviews match your search" : "No interviews yet"}</p><p className="mt-1 text-sm text-muted">{search ? "Try another title, role, or technology." : "Create your first interview to see it here."}</p></div>}
          <div className="divide-y divide-border">
            {filteredInterviews.map((interview) => {
              const destination = interview.status === "completed" ? `/interviews/${interview.id}/result` : `/interviews/${interview.id}/coding`;
              return <div key={interview.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={destination} className="truncate text-sm font-semibold text-foreground hover:text-primary">{interview.title}</Link><span className={interview.status === "completed" ? "rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success" : "rounded-full bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning"}>{interview.status === "completed" ? "Completed" : "In progress"}</span></div><p className="mt-1 text-sm text-muted">{interview.role} · {new Date(interview.createdAt).toLocaleDateString()}</p><div className="mt-3 flex flex-wrap gap-2">{interview.technologies.map((technology) => <span key={technology} className="rounded-full bg-surface-hover px-2 py-1 text-[11px] text-muted">{technology}</span>)}</div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><span className="text-xs text-muted">{interview.answeredQuestions}/{interview.totalQuestions} answered</span><Link href={destination} className="text-sm font-medium text-primary hover:underline">{interview.status === "completed" ? "View result" : "Continue"}</Link><Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={() => handleDelete(interview)}>Delete</Button></div></div>;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
