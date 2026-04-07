import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import { UserRole } from "@local-market/shared";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  // Redirect to role-specific dashboard
  if (user.role === UserRole.BUSINESS) return redirect("/dashboard/business/inventory");
  if (user.role === UserRole.INFLUENCER) return redirect("/dashboard/influencer/businesses");
  if (user.role === UserRole.ADMIN) return redirect("/dashboard/admin/businesses");

  return json({ user });
}

export default function DashboardIndex() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome, {user.name}!</h1>
      <p className="text-gray-500">Select a section from the sidebar to get started.</p>
    </div>
  );
}
