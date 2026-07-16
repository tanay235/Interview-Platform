"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Loader, useToast } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface InterviewRoom {
  id: string;
  title: string;
  role: string;
  difficulty: "easy" | "medium" | "hard";
  technologies: string[];
  questions: string[];
  answers: string[];
  status: "in-progress" | "completed";
}

interface RoomResponse {
  success: boolean;
  data: { interview: InterviewRoom };
}

export default function InterviewRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [interview, setInterview] = useState<InterviewRoom | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    apiClient<RoomResponse>(`/interviews/${params.id}`)
      .then((response) => {
        setInterview(response.data.interview);
        hasLoaded.current = true;
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load interview"))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, params.id, router, user]);

  useEffect(() => {
    if (isAuthLoading || !user || !interview || interview.status === "completed") return;
    const timer = window.setInterval(() => setTimeLeft((current) => Math.max(current - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [interview, isAuthLoading, user]);

  useEffect(() => {
    if (!hasLoaded.current || !interview || interview.status === "completed") return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      apiClient<{ success: boolean }>(`/interviews/${interview.id}/answers`, {
        method: "PATCH",
        body: JSON.stringify({ questionIndex, answer: interview.answers[questionIndex] ?? "" }),
      })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("idle"));
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [interview, questionIndex]);

  function updateAnswer(answer: string) {
    setInterview((current) => {
      if (!current) return current;
      const answers = [...current.answers];
      answers[questionIndex] = answer;
      return { ...current, answers };
    });
  }

  async function handleEndInterview() {
    if (!interview || !window.confirm("Are you sure you want to end this interview?")) return;
    try {
      await apiClient<{ success: boolean }>(`/interviews/${interview.id}/end`, { method: "POST" });
      toast.success("Interview ended");
      router.push(`/interviews/${interview.id}/result`);
    } catch (endError) {
      toast.error(endError instanceof Error ? endError.message : "Unable to end interview");
    }
  }

  if (isAuthLoading || isLoading) return <div className="flex justify-center py-16"><Loader size="lg" /></div>;
  if (error || !interview) return <Card><CardContent><p className="text-sm text-error">{error || "Interview not found"}</p></CardContent></Card>;

  const totalQuestions = interview.questions.length;
  const progress = ((questionIndex + 1) / totalQuestions) * 100;
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const isCompleted = interview.status === "completed";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-primary">{interview.role}</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{interview.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {interview.technologies.map((technology) => <span key={technology} className="rounded-full bg-surface-hover px-2.5 py-1 text-xs text-muted">{technology}</span>)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`rounded-lg border px-3 py-2 text-center ${timeLeft < 60 ? "border-error/50 text-error" : "border-border text-foreground"}`}>
            <p className="text-[10px] uppercase tracking-wider text-muted">Time left</p>
            <p className="font-mono text-lg font-semibold">{minutes}:{seconds}</p>
          </div>
          <Button variant="danger" onClick={handleEndInterview} disabled={isCompleted}>{isCompleted ? "Interview ended" : "End interview"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Question {questionIndex + 1} of {totalQuestions}</CardTitle>
              <CardDescription className="mt-1">{isCompleted ? "This interview has been completed." : "Take your time and explain your reasoning clearly."}</CardDescription>
            </div>
            <span className="text-sm font-medium text-muted">{saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : ""}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-hover"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-8 text-foreground">{interview.questions[questionIndex]}</p>
          <textarea value={interview.answers[questionIndex] ?? ""} onChange={(event) => updateAnswer(event.target.value)} disabled={isCompleted} placeholder="Write your answer here..." className="mt-6 min-h-48 w-full resize-y rounded-lg border border-border bg-background p-4 text-sm leading-6 text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60" />
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
            <Button variant="outline" onClick={() => setQuestionIndex((current) => Math.max(current - 1, 0))} disabled={questionIndex === 0}>Previous</Button>
            <Button onClick={() => setQuestionIndex((current) => Math.min(current + 1, totalQuestions - 1))} disabled={questionIndex === totalQuestions - 1}>{questionIndex === totalQuestions - 1 ? "Last question" : "Next question"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
