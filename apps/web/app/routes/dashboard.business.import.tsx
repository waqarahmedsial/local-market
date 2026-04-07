import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { getSessionTokens } from "~/lib/session.server";
import axios from "axios";
import type { AiImportResponse, AiImportPreview } from "@local-market/shared";
import { useState } from "react";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { accessToken } = await getSessionTokens(request);

  let businessId: string | null = null;
  try {
    const { data } = await axios.get<{ data: { _id: string } }>(
      `${API_BASE}/businesses/my`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    businessId = data.data._id;
  } catch {}

  return json({ user, businessId });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await getSessionTokens(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const businessId = formData.get("businessId") as string;
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (intent === "preview-text") {
    const text = formData.get("text") as string;
    try {
      const { data } = await axios.post<{ data: AiImportResponse }>(
        `${API_BASE}/ai/import/text`,
        { text, businessId },
        { headers },
      );
      return json({ step: "preview", preview: data.data, error: null });
    } catch (err: any) {
      return json({ step: "input", preview: null, error: err?.response?.data?.error ?? "AI import failed" });
    }
  }

  if (intent === "confirm-import") {
    const itemsJson = formData.get("items") as string;
    const items = JSON.parse(itemsJson) as AiImportPreview[];
    try {
      await axios.post(
        `${API_BASE}/businesses/${businessId}/items/bulk`,
        { items },
        { headers },
      );
      return redirect("/dashboard/business/inventory");
    } catch (err: any) {
      return json({ step: "input", preview: null, error: err?.response?.data?.error ?? "Bulk import failed" });
    }
  }

  return json({ step: "input", preview: null, error: null });
}

export default function BusinessImportPage() {
  const { businessId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const preview = actionData?.preview as AiImportResponse | null;
  const isPreview = actionData?.step === "preview" && preview;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">🤖 AI Import</h1>
      <p className="text-gray-500 mb-6">
        Describe your products in any language — Urdu, Hindi, English, or Roman Urdu.
        AI will extract and normalize them for you.
      </p>

      {actionData?.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {actionData.error}
        </div>
      )}

      {!isPreview ? (
        // Input Step
        <div className="card">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="businessId" value={businessId ?? ""} />
            <input type="hidden" name="intent" value="preview-text" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe your products (any language)
              </label>
              <textarea
                name="text"
                rows={6}
                required
                className="input resize-none"
                placeholder={"Examples:\n1kg tamatar 50rs, 2kg aloo 80rs\nمرغی 350 فی کلو، گوشت 800 فی کلو\nTomatoes 50/kg, Onions 40/kg"}
              />
              <p className="text-xs text-gray-400 mt-1">
                Supports Urdu, Hindi, Roman Urdu, English, and misspellings.
              </p>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? "🤖 Analyzing…" : "🤖 Analyze with AI"}
            </button>
          </Form>
        </div>
      ) : (
        // Preview Step
        <div>
          <div className="card mb-4">
            <h2 className="font-semibold text-lg mb-4">
              AI found {preview.items.length} products — please review:
            </h2>

            <div className="space-y-3">
              {preview.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.suggestedName}</p>
                    <p className="text-xs text-gray-400">Original: &ldquo;{item.rawInput}&rdquo;</p>
                    {item.suggestedCategory && (
                      <p className="text-xs text-gray-400">Category: {item.suggestedCategory}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.price && (
                      <p className="font-semibold text-brand-600">Rs {item.price}{item.unit ? `/${item.unit}` : ""}</p>
                    )}
                    <span className={`badge ${item.confidence >= 0.8 ? "badge-green" : "badge-yellow"} mt-1`}>
                      {Math.round(item.confidence * 100)}% confident
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Form method="post" className="flex-1">
              <input type="hidden" name="businessId" value={businessId ?? ""} />
              <input type="hidden" name="intent" value="confirm-import" />
              <input type="hidden" name="items" value={JSON.stringify(preview.items)} />
              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? "Saving…" : `✅ Confirm & Save ${preview.items.length} items`}
              </button>
            </Form>
            <Form method="post">
              <input type="hidden" name="intent" value="reset" />
              <button type="submit" className="btn-secondary">
                ← Start over
              </button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
