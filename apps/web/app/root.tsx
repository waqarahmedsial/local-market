import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import globalStyles from "~/styles/globals.css?url";

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", type: "image/svg+xml" },
  { rel: "stylesheet", href: globalStyles },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    ENV: {
      API_URL: process.env.API_URL ?? "http://localhost:3001/api/v1",
    },
  });
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Majra Marketplace — Village Marketplace</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full font-sans" suppressHydrationWarning>
        <Outlet />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
