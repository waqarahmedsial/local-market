import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { PaginatedResponse, AuditLog } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { accessToken } = await getSessionTokens(request);
  const { data } = await axios.get<{ data: PaginatedResponse<AuditLog> }>(
    `${API_BASE}/audit`,
    { headers: { Authorization: `Bearer ${accessToken}` }, params: { limit: 50 } },
  );
  return json({ user, logs: data.data });
}

export default function AdminAuditPage() {
  const { logs } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Audit Logs</h1>
      <p className="text-gray-500 mb-6">Complete history of all admin actions.</p>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Note</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.data.map((log: AuditLog) => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="badge badge-blue">{log.action}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{log.entity}</p>
                  <p className="text-xs text-gray-400 font-mono">{log.entityId}</p>
                </td>
                <td className="px-4 py-3 text-gray-500">{log.note ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.data.length === 0 && (
          <div className="text-center py-12 text-gray-400">No audit logs yet.</div>
        )}
      </div>
    </div>
  );
}
