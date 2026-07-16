"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Loader } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface InterviewResult {
  interview: { id: string; title: string; role: string; difficulty: string };
  overallScore: number;
  answeredQuestions: number;
  totalQuestions: number;
  completionPercentage: number;
  codingSubmitted: boolean;
  strengths: string[];
  weaknesses: string[];
  status: "in-progress" | "completed";
}

export default function InterviewResultPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    apiClient<{ success: boolean; data: { result: InterviewResult } }>(`/interviews/${params.id}/result`)
      .then((response) => setResult(response.data.result))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load interview result"))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, params.id, router, user]);

  if (isAuthLoading || isLoading) return <div className="flex justify-center py-16"><Loader size="lg" /></div>;
  if (error || !result) return <Card><CardContent><p className="text-sm text-error">{error || "Interview result not found"}</p></CardContent></Card>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Interview complete</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{result.interview.title}</h2>
          <p className="mt-2 text-sm text-muted">{result.interview.role} · {result.interview.difficulty}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")}>Back to dashboard</Button>
      </div>

      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
          <div className="flex h-36 w-36 shrink-0 flex-col items-center justify-center rounded-full border-8 border-primary/25 bg-background">
            <span className="text-4xl font-bold text-foreground">{result.overallScore}%</span>
            <span className="mt-1 text-xs uppercase tracking-wider text-muted">Overall score</span>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">Here&apos;s your performance summary</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Your score reflects the questions you answered and whether you submitted a coding solution. Review the details below to identify your next areas of focus.</p>
          </div>
        </CardContent>
      </Card>

      <section aria-label="Performance summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Overall score" value={`${result.overallScore}%`} detail="Interview performance" />
        <SummaryCard label="Answered questions" value={`${result.answeredQuestions}/${result.totalQuestions}`} detail="Questions completed" />
        <SummaryCard label="Completion" value={`${result.completionPercentage}%`} detail="Interview progress" />
        <SummaryCard label="Coding submission" value={result.codingSubmitted ? "Submitted" : "Not submitted"} detail="Solution status" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <InsightCard title="Strengths" description="What went well in this interview" items={result.strengths} tone="success" />
        <InsightCard title="Areas to improve" description="Focus areas for your next attempt" items={result.weaknesses} tone="warning" />
      </section>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="p-5"><p className="text-sm text-muted">{label}</p><p className="mt-3 text-2xl font-bold text-foreground">{value}</p><p className="mt-2 text-xs text-muted">{detail}</p></Card>;
}

function InsightCard({ title, description, items, tone }: { title: string; description: string; items: string[]; tone: "success" | "warning" }) {
  const color = tone === "success" ? "text-success" : "text-warning";
  const background = tone === "success" ? "bg-success/10" : "bg-warning/10";
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><ul className="space-y-3">{items.length > 0 ? items.map((item) => <li key={item} className="flex items-start gap-3 text-sm text-foreground"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${background} ${color}`}>{tone === "success" ? "✓" : "!"}</span><span className="leading-6">{item}</span></li>) : <li className="text-sm text-muted">No insights available yet.</li>}</ul></CardContent></Card>;
}
