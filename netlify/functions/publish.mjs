export default async (request) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  return new Response(JSON.stringify({ error: "A közzététel még nincs konfigurálva. Előbb biztonságosan be kell állítani a Netlify és GitHub hozzáférést." }), { status: 501, headers: { "content-type": "application/json" } });
};
