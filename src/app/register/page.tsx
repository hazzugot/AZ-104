import { Nav } from "@/components/nav";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(10).max(128),
});

async function register(formData: FormData) {
  "use server";
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`);
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=An%20account%20with%20that%20email%20already%20exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash, role: "STUDENT" },
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <Nav />
      <main className="container flex justify-center py-16">
        <form action={register} className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Track your AZ-104 progress and unlock adaptive study plans.
          </p>
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="text-sm font-medium">Full name</label>
            <input id="name" name="name" required minLength={2}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" required
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" required minLength={10}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-muted-foreground">At least 10 characters.</p>
          </div>
          <button type="submit"
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            Create account
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Already have one?{" "}
            <a href="/login" className="underline">Sign in</a>
          </p>
        </form>
      </main>
    </div>
  );
}
