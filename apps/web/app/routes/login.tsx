import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import axios from "axios";
import { setSessionCookieHeader, getSessionTokens } from "~/lib/session.server";
import type { AuthResponse } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  if (accessToken) throw redirect("/dashboard");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { data } = await axios.post<{ data: AuthResponse }>(`${API_BASE}/auth/login`, {
      email,
      password,
    });

    const cookieHeader = await setSessionCookieHeader(data.data.tokens);
    return redirect("/dashboard", {
      headers: { "Set-Cookie": cookieHeader },
    });
  } catch (err: any) {
    const message = err?.response?.data?.message ?? "Invalid email or password";
    return json({ error: message }, { status: 400 });
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-brand-700">🌍 Majra Marketplace</Link>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <div className="card">
          {actionData?.error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {actionData.error}
            </div>
          )}

          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </Form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
