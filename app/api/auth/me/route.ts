import { NextResponse } from "next/server";
import { getAuthUserById, publicAuthUser } from "@/lib/auth-store";
import { getSession } from "@/lib/server-auth";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, user: null }, { status: 401 });
    const user = await getAuthUserById(session.userId);
    if (!user) return NextResponse.json({ success: false, user: null }, { status: 401 });
    return NextResponse.json({ success: true, user: publicAuthUser(user) });
  } catch (error) {
    return apiError(error);
  }
}
