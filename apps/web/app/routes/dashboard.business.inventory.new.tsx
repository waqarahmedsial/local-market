import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const { accessToken } = await getSessionTokens(request);

  let businessId: string | null = null;
  try {
    const { data } = await axios.get<{ data: { _id: string } }>(
      `${API_BASE}/businesses/my`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    businessId = data.data._id;
  } catch {
    // no business registered yet — loader will redirect to profile page
  }

  if (!businessId) {
    return redirect("/dashboard/business/profile");
  }

  return json({ businessId });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  const formData = await request.formData();
  const businessId = formData.get("businessId") as string;
  const headers = { Authorization: `Bearer ${accessToken}` };

  const price = parseFloat(formData.get("price") as string);
  const stockRaw = formData.get("stock") as string;
  const stock = stockRaw ? parseInt(stockRaw, 10) : undefined;

  try {
    await axios.post(
      `${API_BASE}/businesses/${businessId}/items`,
      {
        rawName: formData.get("rawName"),
        price,
        unit: (formData.get("unit") as string) || undefined,
        stock: !isNaN(stock as number) ? stock : undefined,
        imageUrl: (formData.get("imageUrl") as string) || undefined,
      },
      { headers },
    );
    return redirect("/dashboard/business/inventory");
  } catch (err: any) {
    return json({ error: err?.response?.data?.message ?? "Failed to add item" });
  }
}

export default function NewInventoryItemPage() {
  const { businessId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard/business/inventory" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Back to Inventory
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Add Item</h1>
      <p className="text-gray-500 mb-6">Add a product to your inventory manually.</p>

      <div className="card max-w-lg">
        {actionData?.error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              name="rawName"
              type="text"
              required
              className="input"
              placeholder="e.g. Tamatar, آلو, Tomato"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter in any language — Urdu, Hindi, Roman Urdu, or English.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (Rs) <span className="text-red-500">*</span>
            </label>
            <input
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              className="input"
              placeholder="e.g. 120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              name="unit"
              type="text"
              className="input"
              placeholder="e.g. kg, dozen, piece"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              className="input"
              placeholder="Leave blank if unlimited"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              name="imageUrl"
              type="url"
              className="input"
              placeholder="https://…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? "Adding…" : "Add Item"}
            </button>
            <Link to="/dashboard/business/inventory" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
