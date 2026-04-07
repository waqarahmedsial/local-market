import { createCookie } from "@remix-run/node";

export const sessionCookie = createCookie("lm_session", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
});

export async function getSessionTokens(
  request: Request,
): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const cookieHeader = request.headers.get("Cookie");
  const session = (await sessionCookie.parse(cookieHeader)) as {
    accessToken?: string;
    refreshToken?: string;
  } | null;

  return {
    accessToken: session?.accessToken ?? null,
    refreshToken: session?.refreshToken ?? null,
  };
}

export async function setSessionCookieHeader(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<string> {
  return sessionCookie.serialize(tokens);
}

export async function clearSessionCookieHeader(): Promise<string> {
  return sessionCookie.serialize({}, { maxAge: 0 });
}
