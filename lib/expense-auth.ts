import { cookies } from "next/headers";
import { getSession, requireUser } from "@/lib/server-auth";

export async function requireExpenseUser() {
  const cookieStore = await cookies();
  const session = await getSession();
  let user = null;
  if (session) user = await requireUser();
  console.info("[EXPENSE AUTH DEBUG]", {
    sessionExists: Boolean(session),
    financeUserIdExists: Boolean(user?.userId),
    userEmailExists: Boolean(user?.email),
    cookieNames: cookieStore.getAll().map((cookie) => cookie.name),
    requestReachedExpensesApi: true,
  });
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}