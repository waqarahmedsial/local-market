import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, Link } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { PaginatedResponse, Business } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { accessToken } = await getSessionTokens(request);
  const { data } = await axios.get<{ data: PaginatedResponse<Business> }>(
    `${API_BASE}/businesses`,
    { headers: { Authorization: `Bearer ${accessToken}` }, params: { limit: 100 } },
  );
  return json({ user, businesses: data.data });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const businessId = formData.get("businessId") as string;
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (intent === "approve") {
    await axios.patch(`${API_BASE}/businesses/${businessId}/approve`, {}, { headers });
  } else if (intent === "reject") {
    await axios.patch(`${API_BASE}/businesses/${businessId}/reject`, {}, { headers });
  } else if (intent === "assign") {
    const influencerId = formData.get("influencerId") as string;
    await axios.patch(`${API_BASE}/businesses/${businessId}/assign-influencer`, { influencerId }, { headers });
  }

  return redirect("/dashboard/admin/businesses");
}

export default function AdminBusinessesPage() {
  const { businesses } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Businesses</h1>
        <span className="badge-gray badge">{businesses.total} total</span>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">City</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {businesses.data.map((b: Business) => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.phone}</p>
                </td>
                <td className="px-4 py-3 text-gray-500">{b.city}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${b.status === "APPROVED" ? "badge-green" : b.status === "PENDING" ? "badge-yellow" : "badge-red"}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {b.status === "PENDING" && (
                      <>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="approve" />
                          <input type="hidden" name="businessId" value={b._id} />
                          <button className="btn-primary text-xs py-1 px-2" disabled={navigation.state !== "idle"}>
                            Approve
                          </button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="reject" />
                          <input type="hidden" name="businessId" value={b._id} />
                          <button className="btn-danger text-xs py-1 px-2" disabled={navigation.state !== "idle"}>
                            Reject
                          </button>
                        </Form>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
