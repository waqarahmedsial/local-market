import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, Link, Form, useLoaderData, useLocation } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { UserRole } from "@local-market/shared";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  return json({ user });
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navItems = getNavItems(user.role as UserRole);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <Link to="/" className="text-xl font-bold text-brand-700">🌍 Majra Marketplace</Link>
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <span className={`badge mt-1 ${roleBadgeClass(user.role as UserRole)}`}>
              {user.role}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Form method="post" action="/logout">
            <button type="submit" className="btn-secondary w-full text-sm">
              Sign out
            </button>
          </Form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

function getNavItems(role: UserRole) {
  switch (role) {
    case UserRole.BUSINESS:
      return [
        { href: "/dashboard", icon: "📊", label: "Overview" },
        { href: "/dashboard/business/inventory", icon: "📦", label: "Inventory" },
        { href: "/dashboard/business/import", icon: "🤖", label: "AI Import" },
        { href: "/dashboard/business/profile", icon: "🏪", label: "Shop Profile" },
      ];
    case UserRole.INFLUENCER:
      return [
        { href: "/dashboard", icon: "📊", label: "Overview" },
        { href: "/dashboard/influencer/businesses", icon: "🏪", label: "Businesses" },
        { href: "/dashboard/influencer/approvals", icon: "✅", label: "Pending Approvals" },
      ];
    case UserRole.ADMIN:
      return [
        { href: "/dashboard", icon: "📊", label: "Overview" },
        { href: "/dashboard/admin/businesses", icon: "🏪", label: "All Businesses" },
        { href: "/dashboard/admin/canonical", icon: "📚", label: "Canonical Items" },
        { href: "/dashboard/admin/variations", icon: "🔗", label: "Pending Variations" },
        { href: "/dashboard/admin/categories", icon: "🗂️", label: "Categories" },
        { href: "/dashboard/admin/audit", icon: "📋", label: "Audit Logs" },
      ];
    default:
      return [];
  }
}

function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN: return "badge-red";
    case UserRole.INFLUENCER: return "badge-blue";
    case UserRole.BUSINESS: return "badge-green";
    default: return "badge-gray";
  }
}
