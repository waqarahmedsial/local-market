import { redirect } from "@remix-run/node";
import axios from "axios";
import { getSessionTokens } from "~/lib/session.server";
import type { User } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function requireUser(request: Request): Promise<User> {
  const { accessToken } = await getSessionTokens(request);
  if (!accessToken) throw redirect("/login");

  try {
    const { data } = await axios.get<{ data: User }>(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.data;
  } catch {
    throw redirect("/login");
  }
}

export async function optionalUser(request: Request): Promise<User | null> {
  try {
    return await requireUser(request);
  } catch {
    return null;
  }
}
