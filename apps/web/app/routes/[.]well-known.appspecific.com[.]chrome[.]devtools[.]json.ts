import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * Chrome DevTools automatically requests this well-known URL.
 * Return a proper 404 JSON response to avoid unhandled Remix router errors.
 */
export async function loader(_: LoaderFunctionArgs) {
  return new Response(null, { status: 404 });
}
