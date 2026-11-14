const REPO_API = "https://api.github.com/repos/diabetic1963/diabetichammer-web";
const POST_PREFIX = "[BEJEGYZÉS]";

function sectionsFromIssue(body) {
  const titleMatch = (body || "").match(/### Az írás címe\s*\n+([\s\S]*?)(?=\n### |$)/i);
  const storyMatch = (body || "").match(/### A napi írásod\s*\n+([\s\S]*?)(?=\n### |$)/i);
  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    story: storyMatch ? storyMatch[1].trim() : (body || "")
  };
}

function addPostBody(container, rawBody) {
  for (const line of (rawBody || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const paragraph = document.createElement("p");
    paragraph.textContent = trimmed.replace(/^#+\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1");
    container.append(paragraph);
  }
}

async function loadPosts() {
  const root = document.querySelector("#posts");
  if (!root) return;
  try {
    const response = await fetch(REPO_API + "/issues?state=open&per_page=100", {
      headers: { "Accept": "application/vnd.github+json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("A bejegyzések most nem érhetők el.");
    const issues = await response.json();
    const posts = issues
      .filter(item => !item.pull_request && item.user?.login === "diabetic1963" && item.title && item.title.startsWith(POST_PREFIX))
      .map(item => ({...item, parsed: sectionsFromIssue(item.body)}))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
      title.textContent = post.parsed.title || "Napi írás";
      const date = document.createElement("div");
      date.className = "date";
      date.textContent = new Date(post.created_at).toLocaleDateString("hu-HU", {
        year: "numeric", month: "long", day: "numeric"
      });
      article.append(title, date);
      addPostBody(article, post.parsed.story);
      root.append(article);
    }
  } catch (error) {
    root.textContent = "A napi írások most nem érhetők el. Kérjük, próbáld újra később.";
  }
}
loadPosts();
