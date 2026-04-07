import "@remix-run/node";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}
