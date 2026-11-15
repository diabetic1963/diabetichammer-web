async function loadPosts() {
  const root = document.querySelector("#posts");
  if (!root) return;

  try {
    const response = await fetch("/.netlify/functions/posts", { cache: "no-store" });
    if (!response.ok) throw new Error("A bejegyzések most nem érhetők el.");
    const data = await response.json();
    const posts = Array.isArray(data.posts) ? data.posts : [];

    root.replaceChildren();
    if (!posts.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Hamarosan itt olvashatók az első napi írások.";
      root.append(empty);
      return;
    }

    for (const post of posts) {
      const article = document.createElement("article");
      article.className = "post";

      const title = document.createElement("h3");
      title.textContent = post.title || "Napi írás";

      const date = document.createElement("div");
      date.className = "date";
      date.textContent = new Date(post.createdAt).toLocaleDateString("hu-HU", {
        year: "numeric", month: "long", day: "numeric"
      });
      article.append(title, date);

      for (const paragraphText of String(post.body || "").split(/\r?\n/)) {
        const trimmed = paragraphText.trim();
        if (!trimmed) continue;
        const paragraph = document.createElement("p");
        paragraph.textContent = trimmed;
        article.append(paragraph);
      }

      if (post.image?.data && /^data:image\/(jpeg|png|webp);base64,/.test(post.image.data)) {
        const img = document.createElement("img");
        img.src = post.image.data;
        img.alt = "A bejegyzéshez feltöltött fénykép";
        img.loading = "lazy";
        img.style.cssText = "display:block;width:100%;height:auto;max-height:520px;object-fit:contain;border-radius:14px;margin-top:16px";
        article.append(img);
      }
      root.append(article);
    }
  } catch {
    root.textContent = "A napi írások most nem érhetők el. Kérjük, próbáld újra később.";
  }
}
loadPosts();
