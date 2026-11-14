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
  if (!expectedPassword || !githubToken) {
    return json({ error: "A közzététel szerveroldali beállítása még hiányzik." }, 503);
  }

  const authorization = request.headers.get("authorization") || "";
  const suppliedPassword = authorization.replace(/^Bearer\\s+/i, "");
  if (!safeEqual(suppliedPassword, expectedPassword)) {
    return json({ error: "Hibás szerkesztői jelszó." }, 401);
  }

  let data;
  try { data = await request.json(); }
  catch { return json({ error: "Hibás kérés." }, 400); }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  const body = typeof data.body === "string" ? data.body.trim() : "";
  if (!title || title.length > 120 || !body || body.length > 20000) {
    return json({ error: "Adj meg címet és szöveget. A cím legfeljebb 120, a szöveg 20 000 karakter lehet." }, 400);
  }

  const issue = await fetch("https://api.github.com/repos/diabetic1963/diabetichammer-web/issues", {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: `[BEJEGYZÉS] ${title}`,
      body: `### Az írás címe\\n\\n${title}\\n\\n### A napi írásod\\n\\n${body}`
    })
  });

  if (!issue.ok) {
    return json({ error: "A GitHub nem fogadta el a bejegyzést. Ellenőrizni kell a szerver hozzáférését." }, 502);
  }

  return json({ success: true });
};