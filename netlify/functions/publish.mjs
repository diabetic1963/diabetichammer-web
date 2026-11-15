import { getStore } from "@netlify/blobs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Nem támogatott kérés." }, 405);

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return json({ error: "A szerkesztő jelszava még nincs beállítva." }, 503);

  const suppliedPassword = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!safeEqual(suppliedPassword, expectedPassword)) return json({ error: "Hibás szerkesztői jelszó." }, 401);

  let data;
  try { data = await request.json(); }
  catch { return json({ error: "Hibás kérés." }, 400); }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  const body = typeof data.body === "string" ? data.body.trim() : "";
  if (!title || title.length > 120 || !body || body.length > 20000) {
    return json({ error: "Adj meg címet és szöveget. A cím legfeljebb 120, a szöveg 20 000 karakter lehet." }, 400);
  }

  let image = null;
  if (data.image) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(data.image.type) || typeof data.image.base64 !== "string" || data.image.base64.length > 5_600_000) {
      return json({ error: "A fénykép formátuma vagy mérete nem megfelelő." }, 400);
    }
    image = { type: data.image.type, data: `data:${data.image.type};base64,${data.image.base64}` };
  }

  try {
    const store = getStore("diabetichammer-posts");
    const id = `${Date.now()}-${crypto.randomUUID()}`;
    await store.setJSON(`post-${id}`, {
      id,
      title,
      body,
      image,
      createdAt: new Date().toISOString()
    });
    return json({ success: true });
  } catch {
    return json({ error: "A bejegyzést most nem sikerült elmenteni. Kérlek, próbáld újra." }, 500);
  }
};
