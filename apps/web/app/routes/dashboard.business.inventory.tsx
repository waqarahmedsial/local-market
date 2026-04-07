import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { PaginatedResponse, Item, Business } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { accessToken } = await getSessionTokens(request);
  const headers = { Authorization: `Bearer ${accessToken}` };

  let business: Business | null = null;
  let items: PaginatedResponse<Item> | null = null;

  try {
    const bizRes = await axios.get<{ data: Business }>(`${API_BASE}/businesses/my`, { headers });
    business = bizRes.data.data;

    if (business) {
      const itemsRes = await axios.get<{ data: PaginatedResponse<Item> }>(
        `${API_BASE}/businesses/${business._id}/items`,
        { headers, params: { limit: 20 } },
      );
      items = itemsRes.data.data;
    }
  } catch {
    // no business yet
  }

  return json({ user, business, items });
}

export default function BusinessInventoryPage() {
  const { user, business, items } = useLoaderData<typeof loader>();

  if (!business) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Inventory</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven&apos;t registered a business yet.</p>
          <Link to="/dashboard/business/profile" className="btn-primary">
            Register Your Business
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{business.name} — Inventory</h1>
          <p className="text-gray-500 text-sm">
            Status: <span className={`badge ${statusBadge(business.status)}`}>{business.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/business/import" className="btn-secondary">
            🤖 AI Import
          </Link>
          <Link to="/dashboard/business/inventory/new" className="btn-primary">
            + Add Item
          </Link>
        </div>
      </div>

      {!items || items.data.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No items yet. Add your first product!
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Original Input</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.data.map((item: Item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.displayName}</td>
                  <td className="px-4 py-3 text-gray-400">{item.rawName}</td>
                  <td className="px-4 py-3 text-brand-600 font-semibold">
                    Rs {item.price}{item.unit ? `/${item.unit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.stock ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${itemStatusBadge(item.status)}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-400">
            {items.total} items total
          </div>
        </div>
      )}
    </div>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case "APPROVED": return "badge-green";
    case "PENDING": return "badge-yellow";
    case "REJECTED": return "badge-red";
    default: return "badge-gray";
  }
}

function itemStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE": return "badge-green";
    case "PENDING_REVIEW": return "badge-yellow";
    case "DRAFT": return "badge-gray";
    case "INACTIVE": return "badge-red";
    default: return "badge-gray";
  }
}
