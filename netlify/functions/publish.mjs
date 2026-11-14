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
  const githubToken = process.env.GITHUB_TOKEN;
  if (!expectedPassword || !githubToken) return json({ error: "A közzététel szerveroldali beállítása még hiányzik." }, 503);

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

  let imageUrl = "";
  if (data.image) {
    const image = data.image;
    const allowed = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    if (!allowed[image.type] || typeof image.base64 !== "string" || image.base64.length > 7_000_000) {
      return json({ error: "A fénykép formátuma vagy mérete nem megfelelő." }, 400);
    }
    const safeName = String(image.name || "foto").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
    const filename = `${Date.now()}-${safeName.replace(/\.[^.]+$/, "")}.${allowed[image.type]}`;
    const upload = await fetch("https://api.github.com/repos/diabetic1963/diabetichammer-web/contents/uploads/" + filename, {
      method: "PUT",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Upload daily post photo", content: image.base64 })
    });
    if (!upload.ok) return json({ error: "A fényképet nem sikerült feltölteni. A bejegyzés nem jelent meg." }, 502);
    imageUrl = `https://raw.githubusercontent.com/diabetic1963/diabetichammer-web/main/uploads/${filename}`;
  }

  const markdown = `### Az írás címe\n\n${title}\n\n### A napi írásod\n\n${body}${imageUrl ? `\n\n![A bejegyzés fényképe](${imageUrl})` : ""}`;
  const issue = await fetch("https://api.github.com/repos/diabetic1963/diabetichammer-web/issues", {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title: `[BEJEGYZÉS] ${title}`, body: markdown })
  });
  if (!issue.ok) return json({ error: "A GitHub nem fogadta el a bejegyzést. Ellenőrizni kell a szerver hozzáférését." }, 502);
  return json({ success: true });
};