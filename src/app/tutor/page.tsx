import { Nav } from "@/components/nav";
import { TutorChat } from "@/components/tutor-chat";

export default function TutorPage() {
  return (
    <div>
      <Nav />
      <main className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight">AI tutor</h1>
        <p className="mt-2 text-muted-foreground">
          Powered by Claude Sonnet, grounded in Microsoft Learn content, and aware of your weak areas.
        </p>
        <div className="mt-8">
          <TutorChat />
        </div>
      </main>
    </div>
  );
}
