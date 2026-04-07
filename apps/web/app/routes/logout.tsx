import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { clearSessionCookieHeader } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const cookieHeader = await clearSessionCookieHeader();
  return redirect("/", {
    headers: { "Set-Cookie": cookieHeader },
  });
}

export async function loader() {
  return redirect("/");
}
