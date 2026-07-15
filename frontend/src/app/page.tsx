"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const statistics = [
  { label: "Total interviews", value: "24", change: "+12%", icon: "briefcase" },
  { label: "Completed", value: "18", change: "+8%", icon: "check" },
  { label: "In progress", value: "4", change: "+2", icon: "clock" },
  { label: "Average score", value: "84%", change: "+5%", icon: "chart" },
] as const;

const recentInterviews = [
  { company: "Acme Corporation", role: "Senior Frontend Engineer", date: "Today, 10:30 AM", status: "Completed", score: "92%", tone: "success" },
  { company: "Vertex Labs", role: "Full Stack Developer", date: "Yesterday, 2:00 PM", status: "In progress", score: "—", tone: "warning" },
  { company: "Northstar Technologies", role: "Product Designer", date: "Jun 12, 2026", status: "Completed", score: "81%", tone: "success" },
  { company: "Cloudline Systems", role: "Backend Engineer", date: "Jun 10, 2026", status: "Completed", score: "78%", tone: "success" },
] as const;

export default function Home() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Your workspace</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Keep your interview preparation moving forward.
          </p>
        </div>
        <Button size="lg" onClick={() => undefined}>
          <PlusIcon />
          Create interview
        </Button>
      </section>

      <section aria-label="Interview statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => (
          <Card key={statistic.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted">{statistic.label}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{statistic.value}</p>
                <p className="mt-2 text-xs font-medium text-success">{statistic.change} from last month</p>
              </div>
              <div className="rounded-lg bg-primary/15 p-2.5 text-primary">
                <StatisticIcon name={statistic.icon} />
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Card padding="none">
        <CardHeader className="mb-0 flex-row items-center justify-between border-b border-border px-5 py-5 sm:px-6">
          <div>
            <CardTitle>Recent interviews</CardTitle>
            <CardDescription className="mt-1">Track your latest interview activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm">View all</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentInterviews.map((interview) => (
              <div key={`${interview.company}-${interview.role}`} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-sm font-semibold text-primary">
                    {interview.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{interview.role}</p>
                    <p className="truncate text-xs text-muted">{interview.company} · {interview.date}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-5 pl-13 sm:justify-end sm:pl-0">
                  <span className={interview.tone === "success" ? "rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success" : "rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"}>
                    {interview.status}
                  </span>
                  <span className="w-10 text-right text-sm font-semibold text-foreground">{interview.score}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlusIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
}

function StatisticIcon({ name }: { name: (typeof statistics)[number]["icon"] }) {
  if (name === "check") return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>;
  if (name === "clock") return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="8.25" /><path strokeLinecap="round" d="M12 7.5v4.75l3 1.75" /></svg>;
  if (name === "chart") return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5v-7m5 7V8m5 11.5V4.5m5 15v-10" /></svg>;
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75Z" /><path strokeLinecap="round" d="M8 9h8M8 13h5" /></svg>;
}
