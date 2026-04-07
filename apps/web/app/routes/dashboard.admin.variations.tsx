import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { ItemVariation } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { accessToken } = await getSessionTokens(request);
  const { data } = await axios.get<{ data: ItemVariation[] }>(
    `${API_BASE}/canonical/variations/pending`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return json({ user, variations: data.data });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const variationId = formData.get("variationId") as string;
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (intent === "approve") {
    const canonicalId = formData.get("canonicalId") as string;
    await axios.patch(`${API_BASE}/canonical/variations/${variationId}/approve`, { canonicalId }, { headers });
  } else if (intent === "reject") {
    await axios.patch(`${API_BASE}/canonical/variations/${variationId}/reject`, {}, { headers });
  }

  return redirect("/dashboard/admin/variations");
}

export default function AdminVariationsPage() {
  const { variations } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Variations</h1>
          <p className="text-gray-500 text-sm">AI-detected name variations awaiting review</p>
        </div>
        <span className="badge-yellow badge">{variations.length} pending</span>
      </div>

      {variations.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No pending variations. The canonical system is up to date! 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {variations.map((v: ItemVariation) => (
            <div key={v._id} className="card flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">{v.rawInput}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-semibold">{v.normalizedForm}</span>
                  {v.language && (
                    <span className="badge-blue badge">{v.language}</span>
                  )}
                </div>
                {v.confidence !== undefined && (
                  <p className="text-xs text-gray-400">
                    AI confidence: {Math.round(v.confidence * 100)}%
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Form method="post" className="flex gap-1">
                  <input type="hidden" name="intent" value="approve" />
                  <input type="hidden" name="variationId" value={v._id} />
                  <input
                    name="canonicalId"
                    required
                    placeholder="Canonical ID"
                    className="input text-xs w-48"
                  />
                  <button
                    type="submit"
                    className="btn-primary text-xs py-1"
                    disabled={navigation.state !== "idle"}
                  >
                    Link
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="reject" />
                  <input type="hidden" name="variationId" value={v._id} />
                  <button
                    type="submit"
                    className="btn-danger text-xs py-1 px-2"
                    disabled={navigation.state !== "idle"}
                  >
                    Reject
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
