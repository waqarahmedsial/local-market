import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { influencerId: user._id, limit: 50 },
    },
  );

  return json({ user, businesses: data.data });
}

export default function InfluencerBusinessesPage() {
  const { businesses } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">My Businesses</h1>
      <p className="text-gray-500 mb-6">Businesses assigned to you for curation.</p>

      {businesses.data.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No businesses assigned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.data.map((b: Business) => (
            <div key={b._id} className="card">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{b.name}</h3>
                <span className={`badge ${b.status === "APPROVED" ? "badge-green" : b.status === "PENDING" ? "badge-yellow" : "badge-red"}`}>
                  {b.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">📍 {b.city}</p>
              <p className="text-sm text-gray-500 mt-2">{b.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
