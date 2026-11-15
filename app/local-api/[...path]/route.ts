// Keep development API calls on the frontend origin when accessing over Tailscale.
// The upstream remains server-controlled; this endpoint is disabled in production.
async function proxy(request: Request) {
  const upstream = process.env.LOCAL_API_PROXY_TARGET;
  if (process.env.NODE_ENV !== "development" || !upstream) {
    return new Response(null, { status: 404 });
  }

  const incoming = new URL(request.url);
  const target = new URL(upstream);
  target.pathname = incoming.pathname.slice("/local-api".length);
  target.search = incoming.search;

  const headers = new Headers();
  for (const name of ["accept", "authorization", "content-type", "range", "last-event-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    });
    const responseHeaders = new Headers(response.headers);
    // fetch decodes compressed bodies before returning them.
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");
    responseHeaders.set("cache-control", "no-store");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ message: "API 서버에 연결할 수 없습니다." }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD };
