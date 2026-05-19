import { auth } from "./auth";
import { Role } from "@prisma/client";

export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new AuthorizationError("Unauthenticated");
  return session.user as { id: string; email: string; role: Role };
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthorizationError("Insufficient role");
  return user;
}
