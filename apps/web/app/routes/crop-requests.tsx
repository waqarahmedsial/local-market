import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData } from "@remix-run/react";
import axios from "axios";
import { optionalUser } from "~/lib/auth.server";
import type {
  PaginatedResponse,
  CropBuyRequest,
} from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") ?? "";
  const cropName = url.searchParams.get("cropName") ?? "";
  const user = await optionalUser(request);

  let requests: PaginatedResponse<CropBuyRequest> | null = null;
  try {
    const { data } = await axios.get<{ data: PaginatedResponse<CropBuyRequest> }>(
      `${API_BASE}/crop-requests`,
      { params: { city: city || undefined, cropName: cropName || undefined, limit: 20 } },
    );
    requests = data.data;
  } catch {
    // ignore
  }

  return json({ requests, city, cropName, user });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  const dto = {
    cropName: String(form.get("cropName") ?? "").trim(),
    quantity: Number(form.get("quantity")),
    unit: String(form.get("unit") ?? "").trim(),
    maxPricePerUnit: form.get("maxPricePerUnit")
      ? Number(form.get("maxPricePerUnit"))
      : undefined,
    city: String(form.get("city") ?? "").trim(),
    description: String(form.get("description") ?? "").trim() || undefined,
    contactName: String(form.get("contactName") ?? "").trim(),
    contactPhone: String(form.get("contactPhone") ?? "").trim(),
  };

  if (!dto.cropName || !dto.quantity || !dto.unit || !dto.city || !dto.contactName || !dto.contactPhone) {
    return json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  if (!/^[0-9+\-\s]{7,15}$/.test(dto.contactPhone)) {
    return json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  try {
    await axios.post(`${API_BASE}/crop-requests`, dto);
    return redirect("/crop-requests?posted=1");
  } catch {
    return json({ error: "Failed to post request. Please try again." }, { status: 500 });
  }
}

export default function CropRequestsPage() {
  const { requests, city, cropName, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
  const posted = url?.searchParams.get("posted") === "1";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <span className="text-xl font-bold text-brand-700">Local Market</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="btn-secondary text-sm">Browse Products</Link>
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Page header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🌾 Crop Buying Requests
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Need to buy crops? Post your requirement below. Farmers and sellers
            will contact you directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Post a request form */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-lg font-semibold mb-4">📋 Post a Buy Request</h2>

              {posted && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✅ Your request has been posted! Farmers will contact you soon.
                </div>
              )}

              {actionData && "error" in actionData && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {actionData.error}
                </div>
              )}

              <Form method="post" className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="cropName"
                    className="input w-full"
                    placeholder="e.g. Wheat, Rice, Cotton, Potato"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      className="input w-full"
                      placeholder="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select name="unit" className="input w-full" required>
                      <option value="">Select</option>
                      <option value="kg">kg</option>
                      <option value="maund">Maund</option>
                      <option value="ton">Ton</option>
                      <option value="quintal">Quintal</option>
                      <option value="bags">Bags</option>
                      <option value="pieces">Pieces</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price per Unit (Rs) <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    name="maxPricePerUnit"
                    type="number"
                    min="0"
                    className="input w-full"
                    placeholder="e.g. 3500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="city"
                    className="input w-full"
                    placeholder="e.g. Lahore, Faisalabad"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    className="input w-full"
                    rows={2}
                    placeholder="Quality requirements, delivery terms, variety..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="contactName"
                    className="input w-full"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="contactPhone"
                    type="tel"
                    className="input w-full"
                    placeholder="03XX-XXXXXXX"
                    pattern="[0-9+\-\s]{7,15}"
                    title="Enter a valid phone number (7–15 digits)"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  📢 Post Buy Request
                </button>
              </Form>
            </div>
          </div>

          {/* Listings */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <Form method="get" className="flex gap-2 mb-6 flex-wrap">
              <input
                name="cropName"
                defaultValue={cropName}
                placeholder="Filter by crop name..."
                className="input flex-1 min-w-[150px]"
              />
              <input
                name="city"
                defaultValue={city}
                placeholder="Filter by city..."
                className="input flex-1 min-w-[130px]"
              />
              <button type="submit" className="btn-secondary">
                🔍 Filter
              </button>
              {(city || cropName) && (
                <Link to="/crop-requests" className="btn-secondary">
                  Clear
                </Link>
              )}
            </Form>

            {!requests || requests.data.length === 0 ? (
              <div className="card text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🌾</div>
                <p className="text-lg">No crop buy requests yet.</p>
                <p className="text-sm mt-1">Be the first to post your requirement!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">{requests.total} open requests</p>
                {requests.data.map((req: CropBuyRequest) => (
                  <CropRequestCard key={req._id} request={req} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CropRequestCard({ request }: { request: CropBuyRequest }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-gray-900">{request.cropName}</h3>
            <span className="badge badge-green text-xs">{request.status}</span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
            <span>
              <span className="font-medium">Quantity:</span>{" "}
              {request.quantity} {request.unit}
            </span>
            {request.maxPricePerUnit && (
              <span>
                <span className="font-medium">Max Price:</span>{" "}
                <span className="text-brand-600 font-semibold">
                  Rs {request.maxPricePerUnit}/{request.unit}
                </span>
              </span>
            )}
            <span>
              <span className="font-medium">📍</span> {request.city}
            </span>
          </div>

          {request.description && (
            <p className="text-sm text-gray-500 mb-2">{request.description}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-gray-900">{request.contactName}</p>
          <a
            href={`tel:${request.contactPhone}`}
            className="text-brand-600 font-semibold text-sm hover:underline"
          >
            📞 {request.contactPhone}
          </a>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
