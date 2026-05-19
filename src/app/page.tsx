import Link from "next/link";
import { Nav } from "@/components/nav";
import { Sparkles, BookOpen, Brain, Target, Activity, Layers } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Full AZ-104 curriculum",
    body: "Every module from Microsoft Learn — identities, storage, compute, networking, monitoring — with beginner, intermediate, and advanced layers.",
  },
  {
    icon: Brain,
    title: "AI exam generator",
    body: "Claude Haiku & Sonnet produce Microsoft-style practice questions with scenario stems, plausible distractors, and full rationale.",
  },
  {
    icon: Target,
    title: "Adaptive learning",
    body: "Per-objective mastery tracking and spaced repetition surface what you actually need to review next.",
  },
  {
    icon: Activity,
    title: "Exam focus intelligence",
    body: "Likely-on-exam topics, traps, and memorization targets surfaced automatically across every lesson.",
  },
  {
    icon: Layers,
    title: "Interactive labs",
    body: "Step-by-step Azure Portal, CLI, PowerShell, Bicep, and Terraform walkthroughs with validation checks.",
  },
  {
    icon: Sparkles,
    title: "AI tutor (Sonnet)",
    body: "Ask questions in plain English. Answers are grounded in Microsoft Learn content via RAG and aware of your weak areas.",
  },
];

export default function Home() {
  return (
    <div>
      <Nav />
      <main className="container py-16">
        <section className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-azure-500" />
            Built for Microsoft Azure Administrator (AZ-104)
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            Pass AZ-104 with an enterprise-grade learning platform.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Microsoft Learn content, AI-generated practice exams, adaptive
            study plans, and a tutor that knows your weak spots — in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Start studying
            </Link>
            <Link
              href="/practice"
              className="rounded-md border bg-card px-5 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Take a practice exam
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border bg-card p-6">
              <f.icon className="h-6 w-6 text-azure-500" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
