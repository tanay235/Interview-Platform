"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Loader } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface InterviewSummary {
  id: string;
  title: string;
  role: string;
  status: "in-progress" | "completed";
  answeredQuestions: number;
  totalQuestions: number;
  score: number;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const firstName = user?.name.split(" ")[0] ?? "there";

  useEffect(() => {
    apiClient<{ success: boolean; data: { interviews: InterviewSummary[] } }>("/interviews")
      .then((response) => setInterviews(response.data.interviews))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard"))
      .finally(() => setIsLoading(false));
  }, []);

  const completed = interviews.filter((interview) => interview.status === "completed");
  const averageScore = completed.length ? Math.round(completed.reduce((total, interview) => total + interview.score, 0) / completed.length) : 0;
  const recentInterviews = useMemo(() => interviews.slice(0, 4), [interviews]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-primary">Your workspace</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Welcome back, {firstName}</h2><p className="mt-2 text-sm text-muted">Keep your interview preparation moving forward.</p></div>
        <Button size="lg" onClick={() => router.push("/interviews/new")}><PlusIcon />Create interview</Button>
      </section>

      {error && <p className="text-sm text-error">{error}</p>}
      {isLoading ? <div className="flex justify-center py-10"><Loader size="lg" /></div> : <>
        <section aria-label="Interview statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total interviews" value={interviews.length.toString()} detail="Saved to your account" icon="briefcase" />
          <StatCard label="Completed" value={completed.length.toString()} detail="Finished interviews" icon="check" />
          <StatCard label="In progress" value={(interviews.length - completed.length).toString()} detail="Ready to continue" icon="clock" />
          <StatCard label="Average score" value={`${averageScore}%`} detail={completed.length ? "Across completed interviews" : "Complete an interview to see your score"} icon="chart" />
        </section>

        <Card padding="none"><CardHeader className="mb-0 flex-row items-center justify-between border-b border-border px-5 py-5 sm:px-6"><div><CardTitle>Recent interviews</CardTitle><CardDescription className="mt-1">Your latest interview activity</CardDescription></div><Button variant="ghost" size="sm" onClick={() => router.push("/interviews")}>View all</Button></CardHeader><CardContent className="p-0">{recentInterviews.length === 0 ? <div className="px-5 py-12 text-center"><p className="text-sm font-medium text-foreground">No interviews yet</p><p className="mt-1 text-sm text-muted">Create your first interview to see it here.</p></div> : <div className="divide-y divide-border">{recentInterviews.map((interview) => <button key={interview.id} type="button" onClick={() => router.push(interview.status === "completed" ? `/interviews/${interview.id}/result` : `/interviews/${interview.id}/room`)} className="flex w-full flex-col gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-hover sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-sm font-semibold text-primary">{interview.role.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{interview.title}</p><p className="truncate text-xs text-muted">{interview.role} · {new Date(interview.createdAt).toLocaleDateString()}</p></div></div><div className="flex items-center justify-between gap-5 pl-13 sm:justify-end sm:pl-0"><span className={interview.status === "completed" ? "rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success" : "rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"}>{interview.status === "completed" ? "Completed" : "In progress"}</span><span className="w-10 text-right text-sm font-semibold text-foreground">{interview.status === "completed" ? `${interview.score}%` : "—"}</span></div></button>)}</div>}</CardContent></Card>
      </>}
    </div>
  );
}

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: "briefcase" | "check" | "clock" | "chart" }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</p><p className="mt-2 text-xs text-muted">{detail}</p></div><div className="rounded-lg bg-primary/15 p-2.5 text-primary"><StatisticIcon name={icon} /></div></div></Card>;
}

function PlusIcon() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>; }
function StatisticIcon({ name }: { name: "briefcase" | "check" | "clock" | "chart" }) {
  if (name === "check") return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>;
  if (name === "clock") return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="8.25" /><path strokeLinecap="round" d="M12 7.5v4.75l3 1.75" /></svg>;
  if (name === "chart") return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5v-7m5 7V8m5 11.5V4.5m5 15v-10" /></svg>;
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75Z" /><path strokeLinecap="round" d="M8 9h8M8 13h5" /></svg>;
}
