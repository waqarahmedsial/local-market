import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { Category } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { data } = await axios.get<{ data: Category[] }>(`${API_BASE}/categories`);
  return json({ user, categories: data.data });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await axios.delete(`${API_BASE}/categories/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } else {
    await axios.post(
      `${API_BASE}/categories`,
      { name: formData.get("name"), parentId: formData.get("parentId") || undefined },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  }

  return redirect("/dashboard/admin/categories");
}

export default function AdminCategoriesPage() {
  const { categories } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";

  const categoryMap = new Map(categories.map((c: Category) => [c._id, c.name]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <div className="card mb-6 max-w-md">
        <h2 className="font-semibold mb-3">Add Category</h2>
        <Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="add" />
          <input name="name" required placeholder="Category name (e.g. Vegetables)" className="input" />
          <select name="parentId" className="input">
            <option value="">No parent (top-level)</option>
            {categories.map((cat: Category) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            + Add Category
          </button>
        </Form>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Parent</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat: Category) => (
              <tr key={cat._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {cat.parentId ? (categoryMap.get(cat.parentId) ?? cat.parentId) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={cat._id} />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                      onClick={(e) => {
                        if (!confirm(`Delete "${cat.name}"?`)) e.preventDefault();
                      }}
                    >
                      Delete
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400">No categories yet.</div>
        )}
      </div>
    </div>
  );
}
