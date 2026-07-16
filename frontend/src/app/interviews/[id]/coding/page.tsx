"use client";

import Editor from "@monaco-editor/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Loader, useToast } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type CodingLanguage = "cpp" | "java" | "python" | "javascript";

interface CodingInterview {
  id: string;
  title: string;
  role: string;
  difficulty: string;
  technologies: string[];
  questions: string[];
  code?: Partial<Record<CodingLanguage, string>>;
}

const languages: { value: CodingLanguage; label: string; monacoLanguage: string }[] = [
  { value: "cpp", label: "C++", monacoLanguage: "cpp" },
  { value: "java", label: "Java", monacoLanguage: "java" },
  { value: "python", label: "Python", monacoLanguage: "python" },
  { value: "javascript", label: "JavaScript", monacoLanguage: "javascript" },
];

const starterCode: Record<CodingLanguage, string> = {
  cpp: "#include <iostream>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  java: "public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  python: "def solve():\n    # Write your solution here\n    pass\n\nif __name__ == \"__main__\":\n    solve()\n",
  javascript: "function solve() {\n  // Write your solution here\n}\n\nsolve();\n",
};

export default function CodingInterviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [interview, setInterview] = useState<CodingInterview | null>(null);
  const [language, setLanguage] = useState<CodingLanguage>("javascript");
  const [code, setCode] = useState<Record<CodingLanguage, string>>(starterCode);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    apiClient<{ success: boolean; data: { interview: CodingInterview } }>(`/interviews/${params.id}`)
      .then((response) => {
        const interviewCode = response.data.interview.code ?? {};
        setInterview(response.data.interview);
        setCode({ ...starterCode, ...interviewCode });
        hasLoaded.current = true;
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load coding interview"))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, params.id, router, user]);

  useEffect(() => {
    if (!hasLoaded.current || !interview) return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      apiClient<{ success: boolean }>(`/interviews/${interview.id}/code`, {
        method: "PATCH",
        body: JSON.stringify({ language, code: code[language] }),
      })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("idle"));
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [code, interview, language]);

  async function handleSubmit() {
    if (!interview || !code[language].trim()) {
      toast.error("Add code before submitting");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient<{ success: boolean }>(`/interviews/${interview.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ language, code: code[language] }),
      });
      setSaveState("saved");
      toast.success("Code submitted successfully");
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to submit code");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading || isLoading) return <div className="flex justify-center py-16"><Loader size="lg" /></div>;
  if (error || !interview) return <Card><CardContent><p className="text-sm text-error">{error || "Coding interview not found"}</p></CardContent></Card>;

  const selectedLanguage = languages.find((item) => item.value === language) ?? languages[3];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <button type="button" onClick={() => router.push(`/interviews/${interview.id}/room`)} className="text-sm font-medium text-primary hover:underline">← Back to interview</button>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{interview.title}</h2>
          <p className="mt-1 text-sm text-muted">{interview.role} · {interview.difficulty} coding challenge</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{saveState === "saving" ? "Saving..." : saveState === "saved" ? "All changes saved" : ""}</span>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>Submit code</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)]">
        <Card padding="none" className="h-fit">
          <CardHeader className="border-b border-border px-5 py-5">
            <CardTitle>Problem</CardTitle>
            <CardDescription className="mt-1">Solve the interview question in your selected language.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <p className="text-sm leading-7 text-foreground">{interview.questions[0] ?? "Write a solution that demonstrates your problem-solving approach."}</p>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Technologies</p>
              <div className="flex flex-wrap gap-2">{interview.technologies.map((technology) => <span key={technology} className="rounded-full bg-surface-hover px-2.5 py-1 text-xs text-muted">{technology}</span>)}</div>
            </div>
          </CardContent>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-border bg-surface px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2"><label htmlFor="coding-language" className="text-xs font-medium text-muted">Language</label><select id="coding-language" value={language} onChange={(event) => setLanguage(event.target.value as CodingLanguage)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary">{languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <span className="text-xs text-muted">Autosaves while you type</span>
          </div>
          <div className="h-[min(65vh,620px)] min-h-[420px]">
            <Editor height="100%" theme="vs-dark" language={selectedLanguage.monacoLanguage} value={code[language]} onChange={(value: string | undefined) => setCode((current) => ({ ...current, [language]: value ?? "" }))} options={{ automaticLayout: true, minimap: { enabled: false }, fontSize: 14, padding: { top: 16 }, scrollBeyondLastLine: false, tabSize: 2 }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
