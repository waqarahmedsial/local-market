import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, Form } from "@remix-run/react";
import axios from "axios";
import { optionalUser } from "~/lib/auth.server";
import type { SearchResult, Item } from "@local-market/shared";

const API_BASE = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const user = await optionalUser(request);

  let searchResult: SearchResult | null = null;
  if (q) {
    try {
      const { data } = await axios.get<{ data: SearchResult }>(`${API_BASE}/search`, {
        params: { q, limit: 20 },
      });
      searchResult = data.data;
    } catch {
      // ignore
    }
  }

  return json({ q, searchResult, user });
}

export default function HomePage() {
  const { q, searchResult, user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <span className="text-xl font-bold text-brand-700">Local Market</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Your Village Market,<br />
          <span className="text-brand-600">Now Online</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Search in any language — Urdu, Hindi, Roman Urdu, or English.
          <br />
          <em className="text-brand-600">"allu"</em> → finds <strong>Potato</strong> near you.
        </p>

        {/* Search bar */}
        <Form method="get" className="flex gap-2 max-w-xl mx-auto">
          <input
            name="q"
            defaultValue={q}
            placeholder='Search: "allu", "آلو", "tomato", "gosht"...'
            className="input flex-1 text-base py-3 px-4"
          />
          <button type="submit" className="btn-primary px-6 py-3 text-base">
            🔍 Search
          </button>
        </Form>
      </section>

      {/* Search results */}
      {searchResult && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold">
              {searchResult.total} results for &ldquo;{q}&rdquo;
            </h2>
            {searchResult.normalizedQuery !== q && (
              <span className="badge-blue">
                Searched as: {searchResult.normalizedQuery}
              </span>
            )}
          </div>

          {searchResult.items.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              No items found. Try a different search term.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResult.items.map((item: Item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Features */}
      {!searchResult && (
        <section className="mx-auto max-w-4xl px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🧠"
              title="AI-Powered Search"
              desc="Search in any language. Our AI understands Urdu, Hindi, Roman Urdu, and misspellings."
            />
            <FeatureCard
              icon="✅"
              title="Influencer Verified"
              desc="Every seller is curated by local influencers. No fake listings, only trusted businesses."
            />
            <FeatureCard
              icon="📦"
              title="Smart Inventory"
              desc="Sellers add products via voice, images, or text. AI handles the rest."
            />
          </div>
        </section>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.displayName}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      )}
      {!item.imageUrl && (
        <div className="w-full h-40 bg-brand-50 rounded-lg mb-3 flex items-center justify-center text-4xl">
          🛒
        </div>
      )}
      <h3 className="font-semibold text-gray-900">{item.displayName}</h3>
      {item.rawName !== item.displayName && (
        <p className="text-xs text-gray-400 mt-0.5">{item.rawName}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-brand-600 font-bold text-lg">
          Rs {item.price}{item.unit ? `/${item.unit}` : ""}
        </span>
        {item.stock !== null && item.stock !== undefined && (
          <span className="text-xs text-gray-400">Stock: {item.stock}</span>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="card text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}
