import { getStore } from "@netlify/blobs";

export default async (request) => {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Nem támogatott kérés." }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  try {
    const store = getStore("diabetichammer-posts");
    const { blobs } = await store.list({ prefix: "post-" });
    const entries = await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })));
    const published = entries
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return new Response(JSON.stringify({ posts: published }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  } catch {
    return new Response(JSON.stringify({ error: "A bejegyzések most nem érhetők el." }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
};
