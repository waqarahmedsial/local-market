import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { PaginatedResponse, Business } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { accessToken } = await getSessionTokens(request);
  const headers = { Authorization: `Bearer ${accessToken}` };

  const { data } = await axios.get<{ data: PaginatedResponse<Business> }>(
    `${API_BASE}/businesses`,
    { headers, params: { limit: 50 } },
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
    await axios.patch(`${API_BASE}/businesses/${businessId}/reject`, { reason: "Rejected by influencer" }, { headers });
  }

  return redirect("/dashboard/influencer/approvals");
}

export default function InfluencerApprovalsPage() {
  const { businesses } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const pending = businesses.data.filter((b: Business) => b.status === "PENDING");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Pending Approvals</h1>
      <p className="text-gray-500 mb-6">Review and approve businesses in your area.</p>

      {pending.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No businesses pending approval. 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((business: Business) => (
            <div key={business._id} className="card flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{business.name}</h3>
                {business.description && <p className="text-gray-500 text-sm mt-1">{business.description}</p>}
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span>📍 {business.address}, {business.city}</span>
                  <span>📞 {business.phone}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Form method="post">
                  <input type="hidden" name="intent" value="approve" />
                  <input type="hidden" name="businessId" value={business._id} />
                  <button
                    type="submit"
                    disabled={navigation.state !== "idle"}
                    className="btn-primary text-sm"
                  >
                    ✅ Approve
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="reject" />
                  <input type="hidden" name="businessId" value={business._id} />
                  <button
                    type="submit"
                    disabled={navigation.state !== "idle"}
                    className="btn-danger text-sm"
                  >
                    ✗ Reject
                  </button>
                </Form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
