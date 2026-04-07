import type { LoaderFunctionArgs } from "@remix-run/node";

const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#15803d" />
  <path d="M32 12c-9.389 0-17 7.611-17 17 0 13.188 17 23 17 23s17-9.812 17-23c0-9.389-7.611-17-17-17Zm0 24.5A7.5 7.5 0 1 1 32 21a7.5 7.5 0 0 1 0 15.5Z" fill="#f0fdf4" />
</svg>`;

export async function loader({ request }: LoaderFunctionArgs) {
  void request;
  return new Response(faviconSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}