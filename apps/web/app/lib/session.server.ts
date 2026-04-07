import { createSession, createCookieSessionStorage } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET || "default-dev-secret";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "lm_session",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    secrets: [sessionSecret],
  },
});

export async function getSessionTokens(
  request: Request,
): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const session = await getSession(request.headers.get("Cookie"));

  return {
    accessToken: session.get("accessToken") ?? null,
    refreshToken: session.get("refreshToken") ?? null,
  };
}

export async function setSessionCookieHeader(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<string> {
  const session = await createSession();
  session.set("accessToken", tokens.accessToken);
  session.set("refreshToken", tokens.refreshToken);
  return commitSession(session);
}

export async function clearSessionCookieHeader(): Promise<string> {
  const session = await createSession();
  return destroySession(session);
}
