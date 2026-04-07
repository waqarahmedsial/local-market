import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import axios from "axios";
import { setSessionCookieHeader, getSessionTokens } from "~/lib/session.server";
import { UserRole, type AuthResponse } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  if (accessToken) throw redirect("/dashboard");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as UserRole) ?? UserRole.BUSINESS;

  try {
    const { data } = await axios.post<{ data: AuthResponse }>(`${API_BASE}/auth/register`, {
      name,
      email,
      password,
      role,
    });

    const cookieHeader = await setSessionCookieHeader(data.data.tokens);
    return redirect("/dashboard", {
      headers: { "Set-Cookie": cookieHeader },
    });
  } catch (err: any) {
    const message = err?.response?.data?.message ?? "Registration failed. Please try again.";
    return json({ error: message }, { status: 400 });
  }
}

export default function RegisterPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-brand-700">🌍 Majra Marketplace</Link>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        <div className="card">
          {actionData?.error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {actionData.error}
            </div>
          )}

          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input id="name" name="name" type="text" required className="input" placeholder="Your name" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="Min. 8 characters" />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">I am a…</label>
              <select id="role" name="role" className="input">
                <option value={UserRole.BUSINESS}>Business Owner</option>
                <option value={UserRole.INFLUENCER}>Influencer / Curator</option>
              </select>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </Form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
