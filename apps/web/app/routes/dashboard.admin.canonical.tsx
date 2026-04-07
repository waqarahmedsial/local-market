import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { PaginatedResponse, CanonicalItem } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { accessToken } = await getSessionTokens(request);
  const { data } = await axios.get<{ data: PaginatedResponse<CanonicalItem> }>(
    `${API_BASE}/canonical`,
    { headers: { Authorization: `Bearer ${accessToken}` }, params: { limit: 100 } },
  );
  return json({ user, canonical: data.data });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (intent === "create") {
    await axios.post(
      `${API_BASE}/canonical`,
      { name: formData.get("name"), categoryId: formData.get("categoryId"), description: formData.get("description") },
      { headers },
    );
  } else if (intent === "merge") {
    const sourceId = formData.get("sourceId") as string;
    const targetId = formData.get("targetId") as string;
    await axios.post(`${API_BASE}/canonical/${sourceId}/merge`, { targetId }, { headers });
  }

  return redirect("/dashboard/admin/canonical");
}

export default function AdminCanonicalPage() {
  const { canonical } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Canonical Items</h1>
          <p className="text-gray-500 text-sm">The &ldquo;truth layer&rdquo; — clean, standardized product names</p>
        </div>
        <span className="badge-gray badge">{canonical.total} items</span>
      </div>

      {/* Quick add form */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-3">Add Canonical Item</h2>
        <Form method="post" className="flex gap-3 flex-wrap">
          <input type="hidden" name="intent" value="create" />
          <input name="name" required placeholder="Clean name (e.g. Potato)" className="input flex-1 min-w-40" />
          <input name="categoryId" required placeholder="Category ID" className="input w-48" />
          <input name="description" placeholder="Description (optional)" className="input flex-1 min-w-48" />
          <button type="submit" className="btn-primary" disabled={navigation.state !== "idle"}>
            + Add
          </button>
        </Form>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {canonical.data.map((item: CanonicalItem) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{item.slug}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${item.status === "ACTIVE" ? "badge-green" : "badge-gray"}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
