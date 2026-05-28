import { Nav } from "@/components/nav";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  async function action(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  }

  return (
    <div>
      <Nav />
      <main className="container flex justify-center py-16">
        <form
          action={action}
          className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6"
        >
          <h1 className="text-2xl font-bold">Sign in</h1>
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </button>
          <p className="text-center text-xs text-muted-foreground">
            No account?{" "}
            <a href="/register" className="underline">Create one</a>
          </p>
        </form>
      </main>
    </div>
  );
}
