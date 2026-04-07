import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { Business } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { accessToken } = await getSessionTokens(request);

  let business: Business | null = null;
  try {
    const { data } = await axios.get<{ data: Business }>(
      `${API_BASE}/businesses/my`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    business = data.data;
  } catch {}

  return json({ user, business });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (intent === "create") {
    try {
      await axios.post(
        `${API_BASE}/businesses`,
        {
          name: formData.get("name"),
          description: formData.get("description"),
          address: formData.get("address"),
          city: formData.get("city"),
          phone: formData.get("phone"),
        },
        { headers },
      );
      return redirect("/dashboard/business/inventory");
    } catch (err: any) {
      return json({ error: err?.response?.data?.message ?? "Failed to register business" });
    }
  }

  return json({ error: null });
}

export default function BusinessProfilePage() {
  const { business } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (business) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Shop Profile</h1>
        <div className="card max-w-lg">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Business Name</p>
              <p className="font-semibold text-gray-900">{business.name}</p>
            </div>
            {business.description && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Description</p>
                <p className="text-gray-600">{business.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Address</p>
              <p className="text-gray-600">{business.address}, {business.city}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Phone</p>
              <p className="text-gray-600">{business.phone}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Status</p>
              <span className={`badge ${business.status === "APPROVED" ? "badge-green" : business.status === "PENDING" ? "badge-yellow" : "badge-red"}`}>
                {business.status}
              </span>
              {business.status === "PENDING" && (
                <p className="text-xs text-gray-400 mt-1">
                  Awaiting approval from an influencer or admin.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Register Your Business</h1>
      <p className="text-gray-500 mb-6">Complete your business profile to start listing products.</p>

      <div className="card max-w-lg">
        {actionData?.error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="create" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input name="name" type="text" required className="input" placeholder="e.g. Ahmed's Grocery" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea name="description" rows={2} className="input resize-none" placeholder="What do you sell?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input name="address" type="text" required className="input" placeholder="Street / Area" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input name="city" type="text" required className="input" placeholder="e.g. Lahore" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" type="tel" required className="input" placeholder="+92 300 1234567" />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Registering…" : "Register Business"}
          </button>
        </Form>
      </div>
    </div>
  );
}
